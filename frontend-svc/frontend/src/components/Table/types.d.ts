/* eslint-disable @typescript-eslint/no-unused-vars */
import { ColumnDefBase } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  export interface ColumnDefBase<TData extends RowData, TValue> {
    className?: string;
  }

  export interface ColumnMeta<TData extends RowData, TValue> {
    align?: "center" | "left" | "right" | "justify" | "char" | undefined;
    isHidden?: boolean;
  }

  export interface TableMeta<TData extends RowData> {
    disableMoreRowSelection?: boolean;
  }
}
