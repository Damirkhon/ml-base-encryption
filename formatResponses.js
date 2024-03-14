import { ItemResponseType } from './constants.js'
import { joinWihComma } from './joinWithComma.js'

/**
 * @module index
 * @description Method to format responses based on item type
 * @param {string} type
 * @param {object} responseValues
 * @returns {string} The formatted responses
 */

export function formatResponses(type, responseValues) {
  const forbiddenTypes = [
    ItemResponseType.SingleSelectionPerRow,
    ItemResponseType.MultipleSelectionPerRow,
    ItemResponseType.SliderRows,
  ]

  if (forbiddenTypes.includes(type)) return ''

  if(type === ItemResponseType.Slider) {
    const min = Number(responseValues?.minValue)
    const max = Number(responseValues?.maxValue)
    const scores = responseValues?.scores
    const options = createArrayFromMinToMax(min, max)

    return joinWihComma(
      options?.map(
        (item, i) => `${item}: ${item}${scores?.length ? ` (score: ${scores[i]})` : ''}`,
      ) || [],
    )
  }

  if (!responseValues?.options?.length) return ''


  return joinWihComma(
    responseValues.options.map(({ text, value, score }) => {
      const stringifiedValue = `${value ?? ''}`;

      return `${text}${stringifiedValue ? `: ${stringifiedValue}` : ''}${
        typeof score === 'number' ? ` (score: ${score})` : ''
      }`;
    }),
  )
}