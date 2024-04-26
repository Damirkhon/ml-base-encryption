import { getObjectFromList } from './getObjectFromList.js'
import { createArrayFromMinToMax } from './createArrayFromMinToMax.js'
import { LookupTableItems, FinalSubscale, ItemResponseType, ElementType, SubscaleTotalScore, Sex } from './constants.js'

export const parseSex = (sex) => (sex === Sex.M ? '0' : '1');

export const INTERVAL_SYMBOL = '~';

export const isSystemItem = (item) =>
  !item.allowEdit &&
  (item.name === LookupTableItems.Age_screen || item.name === LookupTableItems.Gender_screen);

  export const getSubScaleScore = (
    subscalesSum,
    type,
    length,
  ) => {
    if (type === SubscaleTotalScore.Average && length === 0) return 0;
  
    return type === SubscaleTotalScore.Sum ? subscalesSum : subscalesSum / length;
  };

  export const calcTotalScore = (
    subscaleSetting,
    activityItems,
  ) => {
    if (!subscaleSetting?.calculateTotalScore) return {};
  
    return calcScores({
        name: FinalSubscale.Key,
        items: Object.keys(activityItems).reduce((acc, item) => {
          const itemType = activityItems[item].activityItem.responseType;
          const allowEdit = activityItems[item].activityItem.allowEdit;
  
          if (
            itemType === ItemResponseType.SingleSelection ||
            itemType === ItemResponseType.MultipleSelection ||
            itemType === ItemResponseType.Slider
          ) {
            acc.push({
              name: item,
              type: ElementType.Item,
              allowEdit,
            });
          }
  
          return acc;
        }, []),
        scoring: subscaleSetting.calculateTotalScore,
        subscaleTableData: subscaleSetting.totalScoresTableData,
      },
      activityItems,
      {},
      {},
    );
  };

export const calcScores = (
  data,
  activityItems,
  subscalesObject,
  result,
) => {
  let itemCount = 0;

  const sumScore = data.items.reduce((acc, item) => {
    const isHidden = activityItems[item.name]?.activityItem?.isHidden;

    if (!isSystemItem(item) && !isHidden) {
      itemCount++;
    }

    if (!item?.type || isHidden) {
      return acc;
    }

    if (item.type === ElementType.Subscale) {
      const calculatedNestedSubscale = calcScores(
        subscalesObject[item.name],
        activityItems,
        subscalesObject,
        result,
      )[item.name];

      result[item.name] = calculatedNestedSubscale;

      return acc + calculatedNestedSubscale.score;
    }

    const answer = activityItems[item.name]?.answer
    const typedOptions = activityItems[item.name]?.activityItem.responseValues
    let value = 0;

    if (typedOptions?.options?.length) {
      const scoresObject = typedOptions.options?.reduce((acc, item) => {
        if (item?.value !== undefined && item?.score !== undefined) {
          acc[item.value] = item.score;
        }

        return acc;
      }, {});

      if (Array.isArray(answer?.value)) {
        value = answer.value?.reduce((res, item) => res + scoresObject[item], 0);
      } else {
        value = scoresObject[answer?.value] || 0;
      }
    }

    if (typedOptions?.scores?.length) {
      const min = Number(typedOptions.minValue);
      const max = Number(typedOptions.maxValue);
      const scores = typedOptions.scores;
      const options = createArrayFromMinToMax(min, max);

      value = scores[options.findIndex((item) => item === answer?.value)] || 0;
    }

    return acc + value;
  }, 0);

  const calculatedScore = getSubScaleScore(sumScore, data.scoring, itemCount);

  if (data?.subscaleTableData) {
    const subscaleTableDataItem = data.subscaleTableData?.find(({ sex, age, rawScore }) => {
      const genderAnswer = activityItems[LookupTableItems.Gender_screen]
        ?.answer;
      const withSex = sex ? parseSex(sex) === String(genderAnswer?.value) : true;
      const withAge = age
        ? String(age) ===
          (activityItems[LookupTableItems.Age_screen]?.answer)
        : true;

      if (!withSex || !withAge) return false;

      const hasInterval = rawScore.includes(INTERVAL_SYMBOL);
      if (!hasInterval) return rawScore === String(calculatedScore);

      const [minScore, maxScore] = rawScore.replace(/\s/g, '').split(INTERVAL_SYMBOL);

      return Number(minScore) <= calculatedScore && calculatedScore <= Number(maxScore);
    });

    return {
      ...result,
      [data.name]: {
        score: Number(subscaleTableDataItem?.score) || calculatedScore,
        optionText: subscaleTableDataItem?.optionalText || '',
      },
    };
  }

  return { ...result, [data.name]: { score: calculatedScore, optionText: '' } };
};

export const getSubscales = (subscaleSetting, activityItems) => {
  if (!subscaleSetting?.subscales?.length || !Object.keys(activityItems).length) return {}

  const subscalesObject = getObjectFromList(
    subscaleSetting.subscales,
    (item) => item.name,
  )

  const parsedSubscales = subscaleSetting.subscales.reduce((acc, item) => {
    const calculatedSubscale = calcScores(item, activityItems, subscalesObject, {});
    acc[item.name] = calculatedSubscale[item.name].score;
    if (calculatedSubscale?.[item.name]?.optionText) {
      acc[`Optional text for ${item.name}`] = calculatedSubscale[item.name].optionText;
    }

    return acc;
  }, {})

  const calculatedTotalScore =
    subscaleSetting.calculateTotalScore && calcTotalScore(subscaleSetting, activityItems);

  return {
    ...(calculatedTotalScore && {
      [FinalSubscale.FinalSubScaleScore]: calculatedTotalScore[FinalSubscale.Key].score,
      [FinalSubscale.OptionalTextForFinalSubScaleScore]:
        calculatedTotalScore[FinalSubscale.Key].optionText,
    }),
    ...parsedSubscales,
  };
};