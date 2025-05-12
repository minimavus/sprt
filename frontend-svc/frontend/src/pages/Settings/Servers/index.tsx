import { useState, type FC, type ReactNode } from "react";
import { use$ } from "@legendapp/state/react";
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Menu,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconForbid2,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { PageLayout } from "@/components/Layout/PageLayout";
import { Loader } from "@/components/Loader";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { Table } from "@/components/Table";
import { FilterBar } from "@/components/Table/FilterBar";
import { RowActionsButton } from "@/components/Table/RowActionsButton";
import {
  useServerSettingsDelete,
  useServersSettings,
  type ServerSettings,
} from "@/hooks/settings/servers";
import { useQueryUser } from "@/hooks/useQueryUser";

import { serverSettingsDisplayStore$ } from "./store";

const Columns: ColumnDef<ServerSettings>[] = [
  {
    header: "Server",
    accessorFn: (d) =>
      (d.attributes?.friendly_name || "") +
      " " +
      d.address +
      " " +
      (d.attributes?.v6_address || ""),
    id: "server",
    cell: ({ row }) => <ServerDisplayName server={row.original} />,
    size: undefined,
  },
  {
    header: "Group",
    accessorFn: (d) => d.group || "",
    sortingFn: (a, b, column) => {
      const aValue = a.getValue(column);
      const bValue = b.getValue(column);
      if (column === "group" && aValue === "") return 1;
      if (column === "group" && bValue === "") return -1;
      return (aValue as string).localeCompare(bValue as string);
    },
    id: "group",
    size: undefined,
    getGroupingValue: (row) => row.group || "Ungrouped",
  },
  {
    header: "RADIUS",
    accessorFn: (d) => d.attributes?.radius || false,
    id: "radius",
    meta: {
      align: "center",
    },
    cell: ({ row }) => <ServerRadiusBadges server={row.original} />,
    size: undefined,
  },
  {
    header: "TACACS+",
    accessorFn: (d) => d.attributes?.tacacs || false,
    id: "tacacs+",
    meta: {
      align: "center",
    },
    cell: ({ row }) => (
      <ServerTacacsBadge enabled={row.original.attributes?.tacacs} />
    ),
    size: undefined,
  },
  {
    header: "",
    id: "actions",
    accessorKey: "id",
    meta: {
      align: "right",
    },
    enableSorting: false,
    cell: ({ row }) => <ServerActions server={row.original} />,
    size: 34,
    maxSize: 34,
    minSize: 34,
  },
];

const ServerActions: FC<{ server: ServerSettings }> = ({ server }) => {
  const nav = useNavigate();
  const l = useLocation();
  const [user] = useQueryUser();
  const { mutateAsync: deleteAsync } = useServerSettingsDelete(user);

  const confirm = useDynamicConfirmation();

  return (
    <ActionIcon.Group>
      <Tooltip label="Edit" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Edit"
          onClick={(e) => {
            if (e.defaultPrevented) return;
            nav(`${server.id}${l.search}`, { relative: "path" });
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
                    Are you sure you want to delete server{" "}
                    <Text span fw="bold">
                      {server.attributes?.friendly_name || server.address}?
                    </Text>
                  </Text>
                ),
                onConfirm: async () => {
                  await deleteAsync({ id: server.id });
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

const ServerDisplayName: FC<{ server: ServerSettings }> = ({ server }) => {
  return (
    <>
      <Text>{server.attributes?.friendly_name || server.address}</Text>
      <Group gap="xs">
        <Text c="dimmed" size="xs">
          IPv4: {server.address}
        </Text>
        {server.attributes?.v6_address ? (
          <>
            <Divider orientation="vertical" size="xs" />
            <Text c="dimmed" size="xs">
              IPv6: {server.attributes.v6_address}
            </Text>
          </>
        ) : null}
      </Group>
    </>
  );
};

const ServerTacacsBadge: FC<{ enabled?: boolean }> = ({ enabled }) => {
  return (
    <Badge
      size="sm"
      color={enabled ? "blue" : "gray"}
      leftSection={
        enabled ? <IconCheck size={14} /> : <IconForbid2 size={14} />
      }
      variant="light"
    >
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
};

const ServerRadiusBadges: FC<{ server: ServerSettings }> = ({ server }) => {
  return (
    <Group justify="center" gap="xs">
      <Badge
        size="sm"
        color={server.attributes?.radius ? "blue" : "gray"}
        leftSection={
          server.attributes?.radius ? (
            <IconCheck size={14} />
          ) : (
            <IconForbid2 size={14} />
          )
        }
        variant="light"
      >
        {server.attributes?.radius ? "Enabled" : "Disabled"}
      </Badge>
      {server.attributes?.radius ? (
        <Badge
          size="sm"
          color={server.coa ? "blue" : "gray"}
          leftSection={
            server.coa ? <IconCheck size={14} /> : <IconForbid2 size={14} />
          }
          variant="light"
        >
          CoA
        </Badge>
      ) : null}
    </Group>
  );
};

const Servers: FC<{ servers: ServerSettings[]; title?: ReactNode }> = ({
  servers,
  title,
}) => {
  const nav = useNavigate();
  const l = useLocation();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const isGrouped = use$(serverSettingsDisplayStore$.displayGrouped);

  return (
    <Stack flex={1} gap="sm" p="md">
      {title ? <Title order={5}>{title}</Title> : null}
      <FilterBar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        placeholder="Search servers"
        // keyFilterChildren={
        //   <Checkbox
        //     label="Group servers"
        //     checked={isGrouped}
        //     onChange={(e) => {
        //       serverSettingsDisplayStore$.setGrouped(e.currentTarget.checked);
        //     }}
        //   />
        // }
      >
        <Button
          onClick={() => {
            nav(`add${l.search}`);
          }}
          leftSection={<IconPlus size={16} />}
        >
          Add server
        </Button>
      </FilterBar>
      <Table
        columns={Columns}
        data={servers}
        highlightOnHover
        initialState={{
          sorting: [{ id: "server", desc: false }],
          globalFilter,
        }}
        grouping={isGrouped ? ["group"] : undefined}
        enableGlobalFilter
        enableGrouping={isGrouped}
      />
    </Stack>
  );
};

const ServersSettings: FC = () => {
  const [user] = useQueryUser();

  return (
    <>
      <PageLayout title="Servers" suspense fullHeight={false}>
        <Loader {...useServersSettings(user)}>
          {(data) => <Servers servers={data} />}
        </Loader>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { ServersSettings };
