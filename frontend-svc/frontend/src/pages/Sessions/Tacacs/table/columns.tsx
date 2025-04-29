import type { CellContext, ColumnDef } from "@tanstack/react-table";

import { FormatTime } from "@/components/Time";
import { TacacsSession } from "@/hooks/sessions/schemas";
import { dateSortingFn } from "@/utils/dateSortingFn";
import { formatTime } from "@/utils/time";

import { DetailsCell } from "./DetailsCell";
import { SessionState } from "./SessionState";

export const columns: ColumnDef<TacacsSession>[] = [
  {
    id: "id",
    header: "ID",
    accessorKey: "id",
    meta: {
      isHidden: true,
    },
  },
  {
    id: "state",
    header: "State",
    size: 50,
    minSize: 50,
    maxSize: 50,
    cell: ({ row }) => <SessionState row={row.original} />,
    meta: {
      align: "center",
    },
  },
  {
    id: "user",
    header: "User",
    accessorFn: (row) => row.user,
    cell: renderOrNone,
    size: undefined,
  },
  {
    id: "ip-addr",
    header: "IP Address",
    accessorKey: "ip_addr",
    cell: renderOrNone,
    size: undefined,
  },
  {
    id: "started",
    header: "Session started",
    cell: ({ row }) => <FormatTime t={row.original.started} />,
    accessorFn: (row) => (row.started ? formatTime(row.started) : ""),
    size: undefined,
    sortingFn: dateSortingFn("started"),
  },
  {
    id: "changed",
    header: "Last updated",
    cell: ({ row }) => <FormatTime t={row.original.changed} />,
    accessorFn: (row) => (row.changed ? formatTime(row.changed) : ""),
    size: undefined,
    sortingFn: dateSortingFn("changed"),
  },
  {
    header: "",
    id: "actions",
    accessorKey: "id",
    meta: {
      align: "right",
    },
    enableSorting: false,
    cell: ({ row }) => <DetailsCell row={row.original} />,
    size: 50,
    maxSize: 50,
    minSize: 50,
  },
];

function renderOrNone({ getValue }: CellContext<any, any>) {
  return getValue() || "-";
}
