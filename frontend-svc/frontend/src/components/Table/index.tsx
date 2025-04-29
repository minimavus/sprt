import {
  Fragment,
  useMemo,
  useState,
  type ForwardedRef,
  type ReactNode,
} from "react";
import {
  Box,
  Divider,
  Group,
  LoadingOverlay,
  Pagination,
  Select,
  Table,
  Text,
  useMantineTheme,
  type ComboboxData,
  type TableProps,
} from "@mantine/core";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFilter,
  type ColumnPinningState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
} from "@tanstack/react-table";
import cx from "classnames";

import { fixedForwardRef } from "@/utils/fixedForwardRef";

import { ActionBar, ActionBarConfig } from "./ActionBar";
import styles from "./Table.module.scss";
import { TableRowExpanded } from "./TableRowExpanded";
import { Th } from "./Th";
import { useColumns } from "./useColumns";
import { getCommonPinningStyles } from "./utils";

import "./types.d";

import { useMergedRef } from "@mantine/hooks";

import { useScrollPinnedShadow } from "./useScrollPinnedShadow";

export { CheckboxColumnId } from "./useColumns";

interface PaginationConfig<TData> {
  showPageSizeChanger: boolean;
  pageSizeOptions?: number[];
  pageCount?: number;
  paginationState?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  getRowId?: TableOptions<TData>["getRowId"];
  totalRows?: number;
  siblings?: number;
  boundaries?: number;
}

type MyTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  paginationConfig?: PaginationConfig<TData>;
  pagination?: boolean;
  rowSelection?: RowSelectionState;
  disableMoreRowSelection?: boolean;
  actionBarConfig?: ActionBarConfig;
  itemSingleText?: string;
  itemPluralText?: string;
  loading?: boolean;
  columnFilters?: ColumnFilter[];
  columnPinningState?: ColumnPinningState;
  containerRef?: ForwardedRef<HTMLDivElement>;
  expandedRowRender?: (row: Row<TData>) => ReactNode;
  emptyState?: ReactNode;
} & Omit<TableProps, "columns" | "data"> &
  Pick<
    TableOptions<TData>,
    | "enableSorting"
    | "initialState"
    | "globalFilterFn"
    | "enableGlobalFilter"
    | "enableRowSelection"
    | "onRowSelectionChange"
    | "onSortingChange"
    | "enableColumnPinning"
    | "manualPagination"
    | "enableExpanding"
    | "getRowCanExpand"
  >;

const externalOrOwn = <T,>(value: T | undefined, defaultValue: T): T => {
  return value === undefined ? defaultValue : value;
};

const defaultPageSizes = [10, 20, 30, 50, 100];

const buildPageSizes = (
  pageSizeOptions: number[] | undefined,
): ComboboxData => {
  const options = pageSizeOptions || defaultPageSizes;
  return options.map((v) => ({ value: v.toString(), label: v.toString() }));
};

const MyTable = <TData,>(
  {
    data,
    columns: columnsFromProps,
    enableSorting = true,
    initialState,
    globalFilterFn = "includesString",
    enableGlobalFilter,
    pagination: enablePagination = false,
    paginationConfig = {
      showPageSizeChanger: true,
    },
    rowSelection,
    enableRowSelection,
    onRowSelectionChange,
    actionBarConfig,
    itemSingleText = "item",
    itemPluralText = "items",
    loading,
    columnFilters,
    onSortingChange,
    enableColumnPinning = false,
    columnPinningState,
    className,
    manualPagination,
    containerRef,
    enableExpanding,
    getRowCanExpand,
    expandedRowRender,
    emptyState = "Nothing to show",
    disableMoreRowSelection,
    ...props
  }: MyTableProps<TData>,
  ref: ForwardedRef<HTMLTableElement>,
): ReactNode => {
  const theme = useMantineTheme();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
    ...initialState?.pagination,
  });

  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting || [],
  );

  const columns = useColumns({
    columns: columnsFromProps,
    expandable: enableExpanding || false,
    selectable: Boolean(enableRowSelection),
  });

  const columnVisibility: VisibilityState = useMemo(() => {
    if (initialState?.columnVisibility) {
      return initialState.columnVisibility;
    }

    return columns.reduce((acc, column) => {
      if (!column.id) {
        return acc;
      }
      acc[column.id] = (column.meta as any)?.isHidden ? false : true;
      return acc;
    }, {} as VisibilityState);
  }, [columns, initialState?.columnVisibility]);

  const table = useReactTable({
    data,
    columns,
    initialState,
    state: {
      pagination: enablePagination
        ? externalOrOwn(paginationConfig.paginationState, pagination)
        : undefined,
      sorting,
      globalFilter: initialState?.globalFilter,
      rowSelection,
      columnVisibility,
      columnFilters,
      columnPinning: columnPinningState || initialState?.columnPinning || {},
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getRowCanExpand,
    getRowId: paginationConfig.getRowId,

    onPaginationChange: enablePagination
      ? (v) => {
          setPagination(v);
          paginationConfig.onPaginationChange?.(v);
        }
      : undefined,
    onSortingChange: (v) => {
      setSorting(v);
      onSortingChange?.(v);
    },
    enableSorting,
    globalFilterFn,
    enableGlobalFilter,
    enableRowSelection,
    onRowSelectionChange,
    enableColumnPinning,
    manualPagination,
    meta: {
      disableMoreRowSelection,
    },
  });

  const pageSizeOptions = useMemo(
    () => buildPageSizes(paginationConfig.pageSizeOptions),
    [paginationConfig.pageSizeOptions],
  );

  const selectedItemCount = enableRowSelection
    ? Object.keys(rowSelection ?? {}).length
    : 0;

  const [ourContainerRef, { leftScrollShadow, rightScrollShadow }] =
    useScrollPinnedShadow(enableColumnPinning);
  const mergedContainerRef = useMergedRef(ourContainerRef, containerRef);

  const handlePageChange = (page: number): void => {
    const newState = {
      ...externalOrOwn(paginationConfig.paginationState, pagination),
      pageIndex: page - 1,
    };
    setPagination(newState);
    paginationConfig.onPaginationChange?.(newState);
  };

  return (
    <>
      {enableRowSelection && selectedItemCount > 0 ? (
        <ActionBar
          selectedItemCount={selectedItemCount}
          onSelectAllItems={
            disableMoreRowSelection
              ? undefined
              : () => table.toggleAllRowsSelected(true)
          }
          onCancelSelection={() => table.toggleAllRowsSelected(false)}
          itemSingleText={itemSingleText}
          itemPluralText={itemPluralText}
          {...actionBarConfig}
        />
      ) : null}
      <Box
        component="div"
        className={styles.table_container}
        ref={mergedContainerRef}
      >
        <LoadingOverlay visible={loading} zIndex={100} />
        <Table
          {...props}
          className={cx(className, {
            [styles.pinnable]: enableColumnPinning,
          })}
          pos="relative"
          ref={ref}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      header={header}
                      key={header.id}
                      leftScrollShadow={leftScrollShadow}
                      rightScrollShadow={rightScrollShadow}
                    />
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={table.getAllColumns().length} align="center">
                  {emptyState}
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                return (
                  <Fragment key={row.id}>
                    <Table.Tr
                      className={
                        enableRowSelection
                          ? row.getIsSelected()
                            ? styles.selected
                            : undefined
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <Table.Td
                            key={cell.id}
                            align={cell.column.columnDef.meta?.align}
                            className={cx(cell.column.columnDef.className)}
                            style={getCommonPinningStyles(cell.column, theme)}
                            data-pinned={
                              cell.column.getIsPinned() ? true : undefined
                            }
                            data-last-left-pinned={
                              cell.column.getIsPinned() === "left" &&
                              cell.column.getIsLastColumn("left") &&
                              leftScrollShadow
                                ? true
                                : undefined
                            }
                            data-first-right-pinned={
                              cell.column.getIsPinned() === "right" &&
                              cell.column.getIsFirstColumn("right") &&
                              rightScrollShadow
                                ? true
                                : undefined
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                    {row.getCanExpand() && row.getIsExpanded() && (
                      <TableRowExpanded row={row}>
                        {expandedRowRender?.(row)}
                      </TableRowExpanded>
                    )}
                  </Fragment>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Box>
      {enablePagination ? (
        <Group justify="space-between" pos="relative">
          <LoadingOverlay loaderProps={{ display: "none" }} visible={loading} />
          <Group pl="xs">
            <Text c="dimmed" size="xs">
              Showing {table.getRowModel().rows.length.toLocaleString()} of{" "}
              {externalOrOwn(
                paginationConfig.totalRows,
                table.getRowCount(),
              ).toLocaleString()}{" "}
              {table.getRowModel().rows.length === 1
                ? itemSingleText
                : itemPluralText}
            </Text>
          </Group>
          <Group>
            <Pagination
              total={externalOrOwn(
                paginationConfig.pageCount,
                table.getPageCount(),
              )}
              value={
                externalOrOwn(paginationConfig.paginationState, pagination)
                  .pageIndex + 1
              }
              onChange={handlePageChange}
              siblings={paginationConfig.siblings}
              boundaries={paginationConfig.boundaries}
              size="sm"
            />
            <Divider orientation="vertical" />
            <Text size="xs">Per page:</Text>
            <Select
              w={80}
              value={`${externalOrOwn(paginationConfig.paginationState, pagination).pageSize}`}
              onChange={(pageSize) => {
                const newState = {
                  ...externalOrOwn(
                    paginationConfig.paginationState,
                    pagination,
                  ),
                  pageSize: parseInt(pageSize!),
                };
                setPagination(newState);
                paginationConfig.onPaginationChange?.(newState);
              }}
              data={pageSizeOptions}
              size="xs"
            />
          </Group>
        </Group>
      ) : null}
    </>
  );
};

const ForwardedRefMyTable = fixedForwardRef(MyTable);

export { ForwardedRefMyTable as Table };
