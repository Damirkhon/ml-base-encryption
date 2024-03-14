import { capitalize } from './capitalize.js'

export const joinWihComma = (array, notCapitalizeItems) => {
  if (!array) return ''

  return array
    .reduce((acc, item) => {
      const stringItem = notCapitalizeItems ? String(item) : capitalize(String(item))
      if (stringItem) {
        acc.push(stringItem)
      }

      return acc
    }, [])
    .join(', ')
};