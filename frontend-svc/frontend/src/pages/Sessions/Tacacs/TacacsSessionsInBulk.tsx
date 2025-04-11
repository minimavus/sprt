import { Dispatch, FC, SetStateAction, Suspense, useState } from "react";
import { useDebouncedState, useResizeObserver } from "@mantine/hooks";
import { DefaultError } from "@tanstack/react-query";
import {
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import {
  Await,
  LoaderFunction,
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
import { SessionsInBulk, TacacsSessionsInBulk } from "@/hooks/sessions/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import { sortingStateToSort } from "@/utils/toSort";

import { ActionBar } from "./ActionBar";
import { ActionsProvider } from "./actionsContext";
import { columns } from "./table/columns";

type LoaderData = {
  data: TacacsSessionsInBulk | null | Promise<TacacsSessionsInBulk | null>;
};

const SessionsTable: FC<{ data: TacacsSessionsInBulk | null }> = ({
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

  const { data, status, fetchStatus } = useSessionInBulk<TacacsSessionsInBulk>({
    user,
    server: params.server!,
    bulk: params.bulk!,
    proto: "tacacs",
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
    <ActionsProvider selected={selected}>
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
            return `${originalRow.id ?? index}`;
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

const TacacsSessionsInBulkDisplay: FC = () => {
  const ld = useLoaderData() as LoaderData;

  return (
    <>
      <Suspense fallback={<DefaultLoaderFallback />}>
        <Await resolve={ld.data} errorElement={<AwaitError before={null} />}>
          {(data: TacacsSessionsInBulk | null) => <SessionsTable data={data} />}
        </Await>
      </Suspense>
      <Outlet />
    </>
  );
};

export { TacacsSessionsInBulkDisplay as TacacsSessionsInBulk };

export const tacacsSessionsInBulkLoader: LoaderFunction = async ({
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
    "tacacs",
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
