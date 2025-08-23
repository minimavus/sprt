import { ActionIcon, ButtonGroup, Text, Tooltip } from "@mantine/core";
import { IconBraces } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { isEmpty, isNil } from "rambda";
import type { FC } from "react";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { Table } from "@/components/Table";
import type { Plugin } from "@/hooks/config/schemas";
import { usePlugins } from "@/hooks/config/usePlugins";

export const columns: ColumnDef<Plugin>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    size: undefined,
  },
  {
    id: "state",
    header: "State",
    size: 50,
    minSize: 50,
    maxSize: 50,
    cell: () => <Text c="green">Enabled</Text>,
    meta: {
      align: "center",
    },
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

function isSchemaPresent(plugin: Plugin): boolean {
  if (isNil(plugin.schema) || isEmpty(plugin.schema)) {
    return false;
  }

  return true;
}

const DetailsCell: FC<{ row: Plugin }> = ({ row }) => {
  return (
    <ButtonGroup>
      <Tooltip label={isSchemaPresent(row) ? "Schema" : "No schema"} withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Schema"
          onClick={(e) => {
            if (e.defaultPrevented) return;
            console.log("TODO: Show plugin schema", row.name);
          }}
          disabled={!isSchemaPresent(row)}
        >
          <IconBraces size={18} />
        </ActionIcon>
      </Tooltip>
      {/* <Menu withArrow>
        <Menu.Target>
          <RowActionsButton />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconPlugOff size={14} />}
            onClick={() => {
              console.log("TODO: Disable plugin", row.name);
            }}
            color="red"
          >
            Disable
          </Menu.Item>
        </Menu.Dropdown>
      </Menu> */}
    </ButtonGroup>
  );
};

export const PluginsView: FC = () => {
  const { data: plugins, error, status } = usePlugins();

  return status === "pending" ? (
    <DefaultLoaderFallback />
  ) : status === "error" ? (
    <DisplayError error={error} />
  ) : plugins?.total === 0 ? (
    <span>No plugins loaded</span>
  ) : (
    <Table
      columns={columns}
      data={plugins.plugins || []}
      highlightOnHover
      itemSingleText="session"
      itemPluralText="sessions"
    />
  );
};
