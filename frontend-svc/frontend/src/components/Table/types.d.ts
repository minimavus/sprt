/* eslint-disable @typescript-eslint/no-unused-vars */
import { ColumnDefBase } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
	export interface ColumnDefBase<_TData extends RowData, _TValue> {
		className?: string;
	}

	export interface ColumnMeta<_TData extends RowData, _TValue> {
		align?: "center" | "left" | "right" | "justify" | "char" | undefined;
		isHidden?: boolean;
	}

	export interface TableMeta<_TData extends RowData> {
		disableMoreRowSelection?: boolean;
	}
}
