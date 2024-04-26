export const getEntityKey = (
  entity,
  useIdFirst = true,
) => {
  if (useIdFirst) return entity?.id ?? entity?.key ?? '';

  return entity?.key ?? entity?.id ?? '';
};

export const getObjectFromList = (
  items,
  getUniqueKey = getEntityKey,
) =>
  items.reduce(
    (acc, item) => ({
      ...acc,
      [(getUniqueKey ?? getEntityKey)(item)]: item,
    }),
    {},
  );