import { Checkbox } from "@mantine/core";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { useMemo } from "react";

import { TableCellWithExpandedIndication } from "./TableCellWithExpandedIndication";

type UseColumnsProps<TData extends RowData> = {
  expandable: boolean;
  selectable: boolean;
  columns: ColumnDef<TData>[];
};

export const CheckboxColumnId = "__selection";

export const useColumns = <TData extends RowData>({
  expandable,
  selectable,
  columns,
}: UseColumnsProps<TData>) => {
  const finalColumnsDef = useMemo<ColumnDef<TData>[]>(() => {
    return [
      ...(expandable
        ? ([
            {
              id: "expand",
              cell: TableCellWithExpandedIndication<TData>,
              size: 20,
              minSize: 20,
              maxSize: 20,
              enableSorting: false,
              enableResizing: false,
              enablePinning: true,
              meta: {
                align: "center",
              },
            },
          ] as ColumnDef<TData>[])
        : []),
      ...(selectable
        ? ([
            {
              id: CheckboxColumnId,
              accessorKey: "id",
              size: 30,
              maxSize: 30,
              minSize: 30,
              enableSorting: false,
              cell: ({ row, table }) => {
                return (
                  <Checkbox
                    checked={row.getIsSelected()}
                    onChange={(v) => {
                      row.toggleSelected(v.target.checked);
                    }}
                    disabled={
                      table.options.meta?.disableMoreRowSelection &&
                      !row.getIsSelected()
                    }
                  />
                );
              },
              header({ table }) {
                return (
                  <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    indeterminate={table.getIsSomeRowsSelected()}
                    onChange={(v) => {
                      if (table.options.meta?.disableMoreRowSelection) {
                        if (table.getIsSomeRowsSelected()) {
                          table.toggleAllRowsSelected(false);
                        }
                        return;
                      }
                      table.toggleAllPageRowsSelected(v.target.checked);
                    }}
                  />
                );
              },
            },
          ] as ColumnDef<TData>[])
        : []),
      ...columns,
    ] as ColumnDef<TData>[];
  }, [columns, expandable, selectable]);

  return finalColumnsDef;
};
