import { Table, useMantineTheme } from "@mantine/core";
import {
  IconArrowsSort,
  IconSortAscending2,
  IconSortDescending2,
} from "@tabler/icons-react";
import { flexRender, type Header } from "@tanstack/react-table";
import cx from "classnames";
import { useState } from "react";

import styles from "./Table.module.scss";
import { getCommonPinningStyles } from "./utils";

export const Th = <TData,>({
  header,
  leftScrollShadow,
  rightScrollShadow,
}: {
  header: Header<TData, unknown>;
  leftScrollShadow: boolean;
  rightScrollShadow: boolean;
}) => {
  const [mouseOver, setMouseOver] = useState(false);
  const theme = useMantineTheme();

  return (
    <Table.Th
      key={header.id}
      colSpan={header.colSpan}
      w={header.column.columnDef.size ? header.getSize() : undefined}
      miw={header.column.columnDef.minSize}
      maw={header.column.columnDef.maxSize}
      className={
        header.column.getCanSort() ? cx(styles.sortable, "select-none") : ""
      }
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      ta={(header.column.columnDef.meta as any)?.align}
      style={getCommonPinningStyles(header.column, theme)}
      data-pinned={header.column.getIsPinned() ? true : undefined}
      data-last-left-pinned={
        header.column.getIsPinned() === "left" &&
        header.column.getIsLastColumn("left") &&
        leftScrollShadow
          ? true
          : undefined
      }
      data-first-right-pinned={
        header.column.getIsPinned() === "right" &&
        header.column.getIsFirstColumn("right") &&
        rightScrollShadow
          ? true
          : undefined
      }
    >
      {header.isPlaceholder ? null : (
        <div
          onClick={header.column.getToggleSortingHandler()}
          title={
            header.column.getCanSort()
              ? header.column.getNextSortingOrder() === "asc"
                ? "Sort ascending"
                : header.column.getNextSortingOrder() === "desc"
                  ? "Sort descending"
                  : "Clear sort"
              : undefined
          }
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getCanSort()
            ? ({
                asc: (
                  <IconSortAscending2
                    size={16}
                    className={styles.sort_indicator}
                  />
                ),
                desc: (
                  <IconSortDescending2
                    size={16}
                    className={styles.sort_indicator}
                  />
                ),
              }[header.column.getIsSorted() as string] ??
              (mouseOver ? (
                <IconArrowsSort size={16} className={styles.sort_indicator} />
              ) : null))
            : null}
        </div>
      )}
    </Table.Th>
  );
};
