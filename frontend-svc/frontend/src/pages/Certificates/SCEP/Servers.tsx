import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { err, ok } from "neverthrow";
import { type FC, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { Table } from "@/components/Table";
import { RowActionsButton } from "@/components/Table/RowActionsButton";
import {
  type ScepServer,
  useScepServerDelete,
  useScepServers,
} from "@/hooks/certificates/scep";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

const scepServersColumns: ColumnDef<ScepServer>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    size: undefined,
  },
  {
    id: "url",
    header: "URL",
    accessorKey: "url",
    size: undefined,
  },
  {
    header: "",
    id: "actions",
    accessorKey: "id",
    size: 20,
    maxSize: 20,
    minSize: 20,
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ row }) => <ServerActions server={row.original} />,
  },
];

const ServerActions: FC<{ server: ScepServer }> = ({ server }) => {
  const nav = useNavigate();
  const l = useLocation();
  const confirm = useDynamicConfirmation();
  const { mutateAsync: deleteAsync } = useScepServerDelete();

  return (
    <ActionIcon.Group>
      <Tooltip label="Edit" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Edit"
          onClick={(e) => {
            if (e.defaultPrevented) return;
            nav(`servers/${server.id}${l.search}`, { relative: "path" });
          }}
        >
          <IconPencil size={18} />
        </ActionIcon>
      </Tooltip>
      <Menu withArrow>
        <Menu.Target>
          <RowActionsButton />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconTrash size={14} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              confirm({
                children: (
                  <Text>
                    Are you sure you want to delete the SCEP server{" "}
                    <Text span fw="bold">
                      {server.name}?
                    </Text>
                  </Text>
                ),
                onConfirm: async () => {
                  try {
                    await deleteAsync({ id: [server.id] });
                    ok(undefined);
                  } catch (error) {
                    return err(getErrorMessage(error, true)!);
                  }
                },
                destructive: true,
                confirmText: "Delete",
              });
            }}
            color="red"
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </ActionIcon.Group>
  );
};

export const SCEPServers: FC = () => {
  const [user] = useQueryUser();
  const { data, error, status } = useScepServers(user);
  const { mutateAsync: deleteAsync, isPending: isDeleting } =
    useScepServerDelete();
  const l = useLocation();
  const nav = useNavigate();

  const [selected, setSelected] = useState<RowSelectionState>({});

  return (
    <Box>
      <Title order={1} mb="md">
        SCEP Servers
      </Title>
      <Paper radius="md" withBorder p="md">
        <Stack gap="sm">
          <Group justify="flex-end">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={(e) => {
                if (e.defaultPrevented) return;
                nav(`servers/new${l.search}`, { relative: "path" });
              }}
            >
              Add SCEP Server
            </Button>
          </Group>
          {status === "pending" ? (
            <DefaultLoaderFallback />
          ) : status === "error" ? (
            <DisplayError error={error} />
          ) : (
            <Table
              highlightOnHover
              columns={scepServersColumns}
              data={data}
              onRowSelectionChange={setSelected}
              rowSelection={selected}
              enableRowSelection
              itemSingleText="SCEP server"
              itemPluralText="SCEP servers"
              emptyState="No SCEP servers found"
              actionBarConfig={{
                children: (
                  <>
                    <ButtonWithConfirm
                      destructive
                      confirmBody="Are you sure you want to delete selected SCEP servers?"
                      confirmText="Delete"
                      loading={isDeleting}
                      onConfirm={async () => {
                        const ids = Object.keys(selected).map(
                          (id) => data[Number(id)].id,
                        );
                        try {
                          await deleteAsync({ id: ids, user });
                        } finally {
                          setSelected({});
                        }
                      }}
                    >
                      Delete
                    </ButtonWithConfirm>
                  </>
                ),
                selectAllText: "Select all",
                className: "",
              }}
            />
          )}
        </Stack>
      </Paper>
    </Box>
  );
};
