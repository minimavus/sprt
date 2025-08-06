import { ColumnDefBase } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: names must match for merge to work
  export interface ColumnDefBase<TData extends RowData, TValue> {
    className?: string;
  }

  // biome-ignore lint/correctness/noUnusedVariables: names must match for merge to work
  export interface ColumnMeta<TData extends RowData, TValue> {
    align?: "center" | "left" | "right" | "justify" | "char" | undefined;
    isHidden?: boolean;
  }

  // biome-ignore lint/correctness/noUnusedVariables: names must match for merge to work
  export interface TableMeta<TData extends RowData> {
    disableMoreRowSelection?: boolean;
  }
}
