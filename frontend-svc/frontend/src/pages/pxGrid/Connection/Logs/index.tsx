import { useState, type FC } from "react";
import { Button, Card, Code, Group, Stack, Text, Title } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  Row,
} from "@tanstack/react-table";
import cx from "classnames";
import { ok } from "neverthrow";
import { useParams } from "react-router-dom";

import { Info } from "@/components/Alerts";
import { DisplayError } from "@/components/Error";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { SkeletonLines } from "@/components/Skeleton";
import { Table } from "@/components/Table";
import { FormatTime, localized24hFormatWithMillis } from "@/components/Time";
import {
  OnCleanupLogs,
  usePxGridConnectionLogs,
  usePxGridConnectionLogsCleanup,
} from "@/hooks/pxgrid/logs";
import { PxGridLog } from "@/hooks/pxgrid/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";

import styles from "../Messages/Messages.module.scss";

type LogsTableProps = {
  logs: PxGridLog[];
  pageSize: number;
  pageIndex: number;
  total: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  loading?: boolean;
};

const columns: ColumnDef<PxGridLog>[] = [
  {
    header: "Time",
    accessorKey: "timestamp",
    cell: ({ cell }) => (
      <Text size="xs">
        <FormatTime
          t={cell.getValue<Date>()}
          relative
          format={localized24hFormatWithMillis}
        />
      </Text>
    ),
  },
  {
    header: "Level",
    accessorKey: "level",
    cell: ({ cell }) => <Text size="xs">{cell.getValue<string>()}</Text>,
  },
  {
    header: "Message",
    accessorKey: "message",
    cell: ({ cell }) => (
      <div className={styles.height_limit} style={{ "--height-limit": "60px" }}>
        <Text size="xs">{JSON.stringify(cell.getValue<string>())}</Text>
      </div>
    ),
  },
];

const RemoveLogsButton: FC<{ onCleanup: OnCleanupLogs }> = ({ onCleanup }) => {
  const confirm = useDynamicConfirmation();

  return (
    <Button
      onClick={() => {
        confirm({
          title: "Remove logs",
          children: <Text>Are you sure you want to remove all logs?</Text>,
          onConfirm: async () => {
            await onCleanup();
            return ok(undefined);
          },
          confirmText: "Remove",
          destructive: true,
        });
      }}
      variant="filled"
      color="red"
      size="xs"
      leftSection={<IconTrash size={16} />}
    >
      Remove Logs
    </Button>
  );
};

const LogsTable: FC<LogsTableProps> = ({
  logs,
  pageIndex,
  total,
  pageSize,
  onPaginationChange,
  loading,
}) => {
  return (
    <Table
      className={styles.messages}
      columns={columns}
      expandedRowRender={(row: Row<PxGridLog>) => {
        return (
          <Card
            className={cx(styles.expanded, styles.break)}
            shadow="none"
            withBorder
            p="xs"
          >
            <Code block bg="transparent">
              {JSON.stringify(row.original.message)}
            </Code>
          </Card>
        );
      }}
      getRowCanExpand={(row: Row<PxGridLog>) => {
        return Boolean(row.original.message);
      }}
      enableExpanding
      data={logs}
      actionBarConfig={{
        cancelSelectionText: "Cancel",
        itemsSelectedText: "Selected logs",
        selectAllText: "",
        className: "",
      }}
      pagination
      manualPagination
      paginationConfig={{
        showPageSizeChanger: true,
        pageSizeOptions: [10, 20, 30, 50, 100],
        pageCount: Math.ceil(total / pageSize),
        paginationState: {
          pageIndex,
          pageSize,
        },
        totalRows: total,
        onPaginationChange,
        getRowId: (row: PxGridLog) => `${row.id}`,
        siblings: 1,
      }}
      initialState={{
        sorting: [{ desc: true, id: "timestamp" }],
      }}
      loading={loading}
      itemPluralText="logs"
      itemSingleText="log"
    />
  );
};

export const Logs: FC = () => {
  const [user] = useQueryUser();
  const { id } = useParams<{ id: string }>();

  const [{ pageSize, pageIndex }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, status, error, isFetching } = usePxGridConnectionLogs(
    id!,
    user,
    {
      page: pageIndex + 1,
      limit: pageSize,
    },
  );

  const onPaginationChangeHandler: OnChangeFn<PaginationState> = (
    updaterOrValue,
  ) => {
    setPagination(updaterOrValue);
  };

  const { mutateAsync: cleanupLogs } = usePxGridConnectionLogsCleanup(
    id!,
    user,
  );

  if (status === "pending") {
    return (
      <Stack gap="xs">
        <SkeletonLines height="lg" w="30%" x={1} />
        <SkeletonLines x={5} mb={0} />
      </Stack>
    );
  }

  if (status === "error") {
    return <DisplayError error={error} />;
  }

  return (
    <>
      <Group justify="space-between">
        <Title order={5}>Logs</Title>
        <RemoveLogsButton onCleanup={cleanupLogs} />
      </Group>
      {data.connection_logs.length === 0 ? (
        <Info>No logs yet</Info>
      ) : (
        <LogsTable
          logs={data.connection_logs}
          pageSize={data.limit}
          pageIndex={pageIndex}
          total={data.total}
          onPaginationChange={onPaginationChangeHandler}
          loading={isFetching}
        />
      )}
    </>
  );
};
