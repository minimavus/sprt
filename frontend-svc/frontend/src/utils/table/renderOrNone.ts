import type { CellContext } from "@tanstack/react-table";

export function renderOrNone({ getValue }: CellContext<any, any>) {
  return getValue() || "-";
}
