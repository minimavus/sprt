import { ActionIcon, Tooltip } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import type { CellContext, RowData } from "@tanstack/react-table";
import cx from "classnames";
import type { FC } from "react";

export const ExpandIndicator: FC<{
  isExpanded: boolean;
}> = ({ isExpanded }) => {
  return (
    <IconChevronRight
      size={18}
      style={{
        transform: isExpanded ? "rotate(90deg)" : "none",
      }}
    />
  );
};

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
          <ExpandIndicator isExpanded={row.getIsExpanded()} />
        </ActionIcon>
      </Tooltip>
    )
  );
};
