import { CSSProperties } from "react";
import { MantineTheme } from "@mantine/core";
import { Column } from "@tanstack/react-table";

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
