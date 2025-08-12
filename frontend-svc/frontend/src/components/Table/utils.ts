import type { MantineTheme } from "@mantine/core";
import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

export const getCommonPinningStyles = <TData>(
  column: Column<TData>,
  _theme: MantineTheme,
): CSSProperties => {
  const isPinned = column.getIsPinned();

  const l = column.getStart("left");

  if (!isPinned) {
    return {};
  }

  return {
    left: isPinned === "left" ? `${l > 0 ? l + 10 : l}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    width: isPinned ? column.getSize() : undefined,
  };
};
