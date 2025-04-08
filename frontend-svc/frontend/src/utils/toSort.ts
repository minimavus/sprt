import { SortingState } from "@tanstack/react-table";

import { Sort } from "./zodSort";

export const sortingStateToSort = (
  sortingState: SortingState,
): Sort | undefined => {
  if (sortingState.length === 0) {
    return undefined;
  }

  const [sort] = sortingState;
  return { sort_by: sort.id, sort_direction: sort.desc ? "desc" : "asc" };
};
