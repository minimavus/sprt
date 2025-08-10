import { useDebouncedState, useResizeObserver } from "@mantine/hooks";
import type { DefaultError } from "@tanstack/react-query";
import type {
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  Suspense,
  useState,
} from "react";
import {
  Await,
  type LoaderFunction,
  Outlet,
  useLoaderData,
  useParams,
} from "react-router-dom";

import { AwaitError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { CheckboxColumnId, Table } from "@/components/Table";
import { FilterBar } from "@/components/Table/FilterBar";
import { queryClient } from "@/hooks/queryClient";
import {
  getSessionInBulkKeyAndEnsureDefaults,
  useSessionInBulk,
} from "@/hooks/sessions";
import type { SessionsInBulk } from "@/hooks/sessions/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import { sortingStateToSort } from "@/utils/toSort";

import { ActionBar } from "./ActionBar";
import { ActionsProvider } from "./actionsContext";
import { columns } from "./table/columns";

type LoaderData = {
  data: SessionsInBulk | null | Promise<SessionsInBulk | null>;
};

const SessionsTable: FC<{ data: SessionsInBulk | null }> = ({
  data: initialData,
}) => {
  const [selected, setSelected] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "changed", desc: true },
  ]);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: initialData?._pagination?.page || 0,
    pageSize: initialData?._pagination?.limit || 50,
  });
  const params = useParams<{
    server: string;
    bulk: string;
  }>();
  const [user] = useQueryUser();
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchDebounced, setGlobalSearchDebounced] = useDebouncedState(
    globalSearch,
    1000,
  );

  const onPaginationChange: Dispatch<SetStateAction<PaginationState>> = (
    update,
  ) => {
    setPaginationState(update);
  };

  const { data, status, fetchStatus } = useSessionInBulk({
    user,
    server: params.server!,
    bulk: params.bulk!,
    proto: "radius",
    pagination: {
      page: paginationState.pageIndex,
      limit: paginationState.pageSize,
    },
    sort: sortingStateToSort(sorting),
    filter: {
      filter_value: globalSearchDebounced || undefined,
      filter_term: undefined,
    },
  });

  const [ref, rect] = useResizeObserver<HTMLDivElement>();

  if (!initialData) {
    return null;
  }

  return (
    <ActionsProvider selected={selected} sessions={data?.sessions}>
      <FilterBar
        globalFilter={globalSearch}
        setGlobalFilter={(v) => {
          setGlobalSearch(v);
          setGlobalSearchDebounced(v);
        }}
      >
        <ActionBar selected={selected} collapsed={(rect.width || 0) < 910} />
      </FilterBar>
      <Table
        containerRef={ref}
        columns={columns}
        data={data?.sessions || []}
        onRowSelectionChange={setSelected}
        manualPagination
        pagination
        highlightOnHover
        paginationConfig={{
          showPageSizeChanger: true,
          onPaginationChange,
          paginationState,
          pageCount: Math.ceil(
            (data || initialData)._pagination.total /
              (data || initialData)._pagination.limit,
          ),
          totalRows: (data || initialData)._pagination.total,
          getRowId(originalRow, index) {
            return originalRow.id ?? index;
          },
        }}
        initialState={{
          sorting,
        }}
        onSortingChange={setSorting}
        rowSelection={selected}
        actionBarConfig={{
          cancelSelectionText: "Cancel",
        }}
        loading={status === "pending" || fetchStatus === "fetching"}
        enableColumnPinning
        columnPinningState={{
          left: [CheckboxColumnId, "state"],
          right: ["actions"],
        }}
        className="table--no-break-word"
        enableRowSelection
        itemSingleText="session"
        itemPluralText="sessions"
      />
    </ActionsProvider>
  );
};

export const RadiusSessionsInBulk: FC = () => {
  const ld = useLoaderData() as LoaderData;

  return (
    <>
      <Suspense fallback={<DefaultLoaderFallback />}>
        <Await resolve={ld.data} errorElement={<AwaitError before={null} />}>
          {(data: SessionsInBulk | null) => <SessionsTable data={data} />}
        </Await>
      </Suspense>
      <Outlet />
    </>
  );
};

export const radiusSessionsInBulkLoader: LoaderFunction = async ({
  params,
  request,
}) => {
  const sp = new URL(request.url).searchParams;
  const user = sp.get("user");
  if (!params.server || !params.bulk) {
    return null;
  }

  const queryKey = getSessionInBulkKeyAndEnsureDefaults(
    user,
    params.server,
    "radius",
    params.bulk,
    { page: 0, limit: 30 },
    undefined,
    undefined,
  );

  return {
    data: queryClient
      .ensureQueryData<unknown, DefaultError, SessionsInBulk>({
        queryKey,
      })
      .then((data) => (data === undefined ? null : data)),
  };
};
