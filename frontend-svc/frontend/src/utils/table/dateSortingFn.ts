import type { Row } from "@tanstack/react-table";

export const dateSortingFn = <Data extends Record<string, any>>(
  column: keyof Data,
) => {
  return (a: Row<Data>, b: Row<Data>) => {
    const aDate: Date | null = a.original[column];
    const bDate: Date | null = b.original[column];

    if (aDate === null && bDate === null) {
      return 0;
    }
    if (aDate === null) {
      return -1;
    }
    if (bDate === null) {
      return 1;
    }
    return aDate.getTime() > bDate.getTime() ? 1 : -1;
  };
};
