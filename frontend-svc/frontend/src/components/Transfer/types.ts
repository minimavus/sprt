import type { Observable } from "@legendapp/state";
import type { ComboboxStore } from "@mantine/core";

export type TransferSide = "source" | "target";
export type TransferTreeKey = string;
export interface TransferTreeBaseDatum {
  label: string;
}
export type TransferTreeDatumCategoryValues = Record<
  TransferTreeKey,
  TransferTreeBaseDatum
>;
export interface TransferTreeDatum extends TransferTreeBaseDatum {
  values?: TransferTreeDatumCategoryValues;
}
export type TransferTreeData<
  TDatum extends TransferTreeDatum = TransferTreeDatum,
> = Record<TransferTreeKey, TDatum>;
export type TransferToBeTransferred = Record<
  TransferTreeKey,
  Set<TransferTreeKey>
>;

export type TransferSideState = {
  state: Observable<{
    selected: Record<string, boolean>;
    search: string;
    options: TransferTreeData;
    sortKeys: boolean;
  }>;
  visibility: Observable<{
    visibleKeys: () => Set<string> | null;
    isVisible: (key: string) => boolean;
  }>;
  combobox: ComboboxStore;
};
