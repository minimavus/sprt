import { Button } from "@mantine/core";
import type { Cell, Row, RowData } from "@tanstack/react-table";

import { ExpandIndicator } from "./TableCellWithExpandedIndication";

export const TableGroupButton = <TData extends RowData>({
  row,
  cell,
}: {
  row: Row<TData>;
  cell: Cell<TData, unknown>;
}) => {
  return (
    <Button
      variant="subtle"
      size="compact-sm"
      {...{
        onClick: row.getToggleExpandedHandler(),
        style: {
          cursor: row.getCanExpand() ? "pointer" : "normal",
        },
      }}
      rightSection={<ExpandIndicator isExpanded={row.getIsExpanded()} />}
    >
      {row.getGroupingValue(cell.column.id) as string} ({row.subRows.length})
    </Button>
  );
};
