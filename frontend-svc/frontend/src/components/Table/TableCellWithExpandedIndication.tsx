import { ActionIcon, Tooltip } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { CellContext, RowData } from "@tanstack/react-table";
import cx from "classnames";

export const TableCellWithExpandedIndication = <TData extends RowData>({
  row,
}: CellContext<TData, unknown>) => {
  const className = cx("row--expandable__trigger", {
    "row--expandable__trigger--expanded": row.getIsExpanded(),
  });

  return (
    row.getCanExpand() && (
      <Tooltip label={row.getIsExpanded() ? "Collapse" : "Expand"} withArrow>
        <ActionIcon
          className={className}
          variant="subtle"
          onClick={() => row.toggleExpanded()}
        >
          <IconChevronRight
            size={18}
            style={{
              transform: row.getIsExpanded() ? "rotate(90deg)" : "none",
            }}
          />
        </ActionIcon>
      </Tooltip>
    )
  );
};
