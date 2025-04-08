import { type ComponentPropsWithRef, type ReactNode, type Ref } from "react";
import { Table } from "@mantine/core";
import type { Row, RowData } from "@tanstack/react-table";
import cx from "classnames";

import { fixedForwardRef } from "@/utils/fixedForwardRef";

import styles from "./Table.module.scss";

export interface TableRowExpandedProps<TData extends RowData>
  extends ComponentPropsWithRef<"tr"> {
  row: Row<TData>;
  children?: ReactNode;
}

const TableRowExpandedComponent = <TData extends RowData>(
  {
    row,
    children = undefined,
    className,
    ...rest
  }: TableRowExpandedProps<TData>,
  ref: Ref<HTMLTableRowElement>,
) => {
  return (
    <Table.Tr
      ref={ref}
      className={cx(styles["row--expandable-content"], className)}
      {...rest}
    >
      <Table.Td colSpan={row.getVisibleCells().length}>{children}</Table.Td>
    </Table.Tr>
  );
};

export const TableRowExpanded = fixedForwardRef(TableRowExpandedComponent);
