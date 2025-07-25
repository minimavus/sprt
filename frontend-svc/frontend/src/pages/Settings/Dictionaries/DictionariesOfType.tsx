import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { AccessorKeyColumnDef, ColumnDef } from "@tanstack/react-table";
import { ok } from "neverthrow";
import type { FC } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { Link } from "@/components/Link";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { SkeletonLines } from "@/components/Skeleton";
import { Table } from "@/components/Table";
import {
  type DictionaryMeta,
  useDictionariesOfType,
  useDictionaryDelete,
  useDictionaryTypes,
} from "@/hooks/settings/dictionaries";
import { useQueryUser } from "@/hooks/useQueryUser";
import { usePermission } from "@/hooks/useUser";

const columns: ColumnDef<DictionaryMeta>[] = [
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    cell: ({ row }) => <DictionaryLink {...row.original} />,
    size: undefined,
    enableSorting: false,
  } as AccessorKeyColumnDef<DictionaryMeta>,
  {
    id: "actions",
    cell: ({ row }) => <DictionaryActions {...row.original} />,
    maxSize: 48,
    size: 48,
  },
];

const DictionaryLink: FC<DictionaryMeta> = ({ id, type, name, is_global }) => {
  return (
    <Group justify="space-between">
      <Link to={`/settings/dictionaries/${type}/${id}`}>{name}</Link>
      {is_global ? (
        <Badge color="teal" size="sm">
          GLOBAL
        </Badge>
      ) : null}
    </Group>
  );
};

const DictionaryActions: FC<DictionaryMeta> = ({ id, type, name, owner }) => {
  const { mutateAsync } = useDictionaryDelete();
  const confirm = useDynamicConfirmation();

  const onDelete = () => {
    confirm({
      title: "Delete dictionary",
      children: (
        <Text>
          Are you sure you want to delete dictionary{" "}
          <Text span fw="bold">
            "{name}"?
          </Text>
        </Text>
      ),
      onConfirm: async () => {
        await mutateAsync({ id, type, user: owner });
        return ok(undefined);
      },
      confirmText: "Delete",
      destructive: true,
    });
  };

  return (
    <Group justify="flex-end">
      <Tooltip label="Delete">
        <ActionIcon size="md" onClick={onDelete} variant="subtle">
          <IconTrash size={18} />
          <VisuallyHidden>Delete</VisuallyHidden>
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

const DictionariesOfType: FC = () => {
  const [u] = useQueryUser();
  const { type: dictionaryType } = useParams<{ type: string }>();
  const canGlobal = usePermission("dictionaries.read.global");
  const { data, status, error } = useDictionariesOfType(
    dictionaryType!,
    canGlobal,
    u,
  );

  if (status === "error") {
    return <DisplayError error={error} />;
  }
  if (status === "pending") {
    return <SkeletonLines x={3} />;
  }

  return <Table columns={columns} data={data} highlightOnHover />;
};

const Heading = () => {
  const { type: dictionaryType } = useParams<{ type: string }>();
  const { data, status } = useDictionaryTypes();
  const nav = useNavigate();
  const l = useLocation();

  if (status === "pending") {
    return <SkeletonLines x={1} width="50%" />;
  }

  const t = data?.find((d) => d.name === dictionaryType)?.title;

  return (
    <Group justify="space-between" align="center">
      <Title order={3}>{t ? `${t} ` : ""}Dictionaries</Title>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => {
          nav(`/settings/dictionaries/${dictionaryType}/add${l.search}`);
        }}
      >
        Add dictionary
      </Button>
    </Group>
  );
};

const HOC = () => {
  return (
    <Stack gap="sm">
      <Heading />
      <DictionariesOfType />
    </Stack>
  );
};

export { HOC as DictionariesOfType };
