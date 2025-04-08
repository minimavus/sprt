import { useState, type FC } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import {
  Button,
  Card,
  Code,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import { ok } from "neverthrow";
import { useParams } from "react-router-dom";

import { Info } from "@/components/Alerts";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { DisplayError } from "@/components/Error";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { SkeletonLines } from "@/components/Skeleton";
import { Table } from "@/components/Table";
import { FormatTime, localized24hFormatWithMillis } from "@/components/Time";
import {
  usePxGridConnectionMessages,
  usePxGridConnectionMessagesDelete,
  type OnDeleteMessages,
} from "@/hooks/pxgrid/messages";
import type { PxGridMessage } from "@/hooks/pxgrid/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";

import styles from "./Messages.module.scss";

const columns: ColumnDef<PxGridMessage>[] = [
  {
    header: "Topic",
    accessorKey: "topic",
    cell: ({ cell }) => <Text size="xs">{cell.getValue<string>()}</Text>,
  },
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
    header: "Message",
    accessorKey: "message",
    cell: ({ cell }) => (
      <div className={styles.height_limit}>
        <Code bg="transparent">{JSON.stringify(cell.getValue<any>())}</Code>
      </div>
    ),
  },
];

type MessageTableProps = {
  messages: PxGridMessage[];
  pageSize: number;
  pageIndex: number;
  total: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  selected: RowSelectionState;
  setSelected: OnChangeFn<RowSelectionState>;
};

const DeleteMessagesButton: FC<{
  onDelete: OnDeleteMessages;
  selected: RowSelectionState;
  setSelected: OnChangeFn<RowSelectionState>;
}> = ({ onDelete, selected, setSelected }) => {
  const confirm = useDynamicConfirmation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          leftSection={<IconTrash size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
          color="red"
        >
          Delete
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            confirm({
              title: "Delete all messages",
              confirmText: "Delete",
              destructive: true,
              onConfirm: async () => {
                await onDelete({ all: true });
                setSelected({});
                return ok(undefined);
              },
              children: "Are you sure you want to delete all messages?",
            });
          }}
        >
          Delete all messages
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            confirm({
              title: "Delete selected messages",
              confirmText: "Delete",
              destructive: true,
              onConfirm: async () => {
                await onDelete({
                  all: false,
                  ids: Object.keys(selected).map(Number),
                });
                setSelected({});
                return ok(undefined);
              },
              children:
                "Are you sure you want to delete the selected messages?",
            });
          }}
          disabled={Object.keys(selected).length === 0}
        >
          Delete selected messages
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

const MessagesTable: FC<MessageTableProps> = ({
  messages,
  pageIndex,
  total,
  pageSize,
  onPaginationChange,
  selected,
  setSelected,
}) => {
  return (
    <Table
      className={styles.messages}
      columns={columns}
      expandedRowRender={(row) => {
        return (
          <Card withBorder shadow="none" p="xs">
            <CopyToClipboard
              value={JSON.stringify(row.original.message)}
              copyLabel="Copy value to clipboard"
              copiedLabel="Copied"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 1,
              }}
            />
            <CodeHighlight
              code={JSON.stringify(row.original.message, null, 2)}
              withCopyButton={false}
              language="json"
              bg="transparent"
            />
          </Card>
        );
      }}
      getRowCanExpand={(row) => {
        return Boolean(row.original.message);
      }}
      enableExpanding
      data={messages}
      onRowSelectionChange={setSelected}
      rowSelection={selected}
      actionBarConfig={{
        cancelSelectionText: "Cancel",
        itemsSelectedText: "Selected messages",
        selectAllText: "",
        className: "",
      }}
      pagination
      manualPagination
      paginationConfig={{
        showPageSizeChanger: true,
        pageSizeOptions: [10, 20, 30, 50, 100],
        pageCount: Math.ceil(total / pageSize),
        totalRows: total,
        paginationState: {
          pageIndex,
          pageSize,
        },
        onPaginationChange,
        getRowId: (row: PxGridMessage) => `${row.id}`,
      }}
      initialState={{ sorting: [{ desc: true, id: "timestamp" }] }}
      enableRowSelection
    />
  );
};

export const Messages: FC = () => {
  const [user] = useQueryUser();
  const { id } = useParams<{ id: string }>();

  const [{ pageSize, pageIndex }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, status, error } = usePxGridConnectionMessages(id!, user, {
    page: pageIndex + 1,
    limit: pageSize,
  });

  const onPaginationChangeHandler: OnChangeFn<PaginationState> = (
    updaterOrValue,
  ) => {
    setPagination(updaterOrValue);
  };

  const { mutateAsync: onDelete } = usePxGridConnectionMessagesDelete(
    id!,
    user,
  );

  const [selected, setSelected] = useState<RowSelectionState>({});

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
        <Title order={5}>Messages</Title>
        <DeleteMessagesButton
          onDelete={onDelete}
          selected={selected}
          setSelected={setSelected}
        />
      </Group>
      {data.messages.length === 0 ? (
        <Info>No messages found</Info>
      ) : (
        <MessagesTable
          messages={data.messages}
          pageSize={data.limit}
          pageIndex={pageIndex}
          total={data.total}
          onPaginationChange={onPaginationChangeHandler}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </>
  );
};
