import type { CellContext, ColumnDef } from "@tanstack/react-table";

import { FormatTime } from "@/components/Time";
import { RadiusSession } from "@/hooks/sessions/schemas";
import { formatTime } from "@/utils/time";

import { DetailsCell } from "./DetailsCell";
import { StateCell } from "./StateCell";

export const columns: ColumnDef<RadiusSession>[] = [
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
    cell: ({ row }) => <StateCell row={row.original} />,
    meta: {
      align: "center",
    },
  },
  {
    id: "proto",
    header: "Protocol",
    accessorFn: (row) => row.attributes?.proto?.toUpperCase(),
    cell: renderOrNone,
  },
  { id: "mac", header: "MAC", accessorKey: "mac", cell: renderOrNone },
  { id: "user", header: "User", accessorKey: "user", cell: renderOrNone },
  {
    id: "sessid",
    header: "Sessions ID",
    accessorKey: "sessid",
    cell: renderOrNone,
  },
  { id: "ipAddr", header: "IP", accessorKey: "ipAddr", cell: renderOrNone },
  {
    id: "started",
    header: "Session started",
    cell: ({ row }) => <FormatTime t={row.original.started} />,
    accessorFn: (row) => (row.started ? formatTime(row.started) : ""),
  },
  {
    id: "changed",
    header: "Last updated",
    cell: ({ row }) => <FormatTime t={row.original.changed} />,
    accessorFn: (row) => (row.changed ? formatTime(row.changed) : ""),
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
