import type {
  TransferTreeBaseDatum,
  TransferTreeData,
  TransferTreeDatum,
  TransferTreeKey,
} from "./types";

export const isCategoryDatum = (
  datum: TransferTreeDatum,
): datum is Required<TransferTreeDatum> => "values" in datum;

const sortValues = (
  values: Record<string, TransferTreeDatum>,
  shouldSort: boolean,
): [string, TransferTreeBaseDatum][] => {
  if (!shouldSort) {
    return Object.entries(values);
  }
  return Object.entries(values).sort(([a], [b]) => a.localeCompare(b));
};

export type SortedCategory = [
  string,
  { label: string; values: [string, TransferTreeDatum][] },
];

export interface SortedTransferTreeCategoryValues
  extends TransferTreeBaseDatum {
  values: [string, TransferTreeBaseDatum][];
}

export const sortData = (
  data: TransferTreeData,
  shouldSort: boolean,
): [
  TransferTreeKey,
  TransferTreeBaseDatum | SortedTransferTreeCategoryValues,
][] => {
  if (!shouldSort) {
    return Object.entries(data).map(([key, datum]) => {
      if (!isCategoryDatum(datum)) {
        return [key, datum];
      }

      return [
        key,
        {
          ...datum,
          values: sortValues(datum.values, shouldSort),
        },
      ];
    });
  }

  return Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, datum]) => {
      if (!isCategoryDatum(datum)) {
        return [key, datum];
      }

      return [
        key,
        {
          ...datum,
          values: sortValues(datum.values, shouldSort),
        },
      ];
    });
};

export type SortedTransferTreeData = ReturnType<typeof sortData>;

export const isSortedCategoryDatum = (
  datum: TransferTreeBaseDatum | SortedTransferTreeCategoryValues,
): datum is SortedTransferTreeCategoryValues => "values" in datum;
