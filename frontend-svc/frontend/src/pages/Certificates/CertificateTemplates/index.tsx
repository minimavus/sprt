import { FC, useState } from "react";
import { Button, Menu, Stack, Text } from "@mantine/core";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { ok } from "neverthrow";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { Table } from "@/components/Table";
import { FilterBar } from "@/components/Table/FilterBar";
import { RowActionsButton } from "@/components/Table/RowActionsButton";
import {
  CertTemplate,
  useCertTemplateDelete,
  useCertTemplates,
} from "@/hooks/certificates/templates";
import { useQueryUser } from "@/hooks/useQueryUser";

const columns: ColumnDef<CertTemplate>[] = [
  {
    header: "Friendly Name",
    id: "friendly_name",
    accessorKey: "friendly_name",
    filterFn: "includesString",
    size: undefined,
  },
  {
    header: "Subject",
    id: "subject",
    accessorKey: "subject",
    filterFn: "includesString",
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
    cell: ({ row }) => <TemplateActions template={row.original} />,
  },
];

const TemplateActions: FC<{ template: CertTemplate }> = ({ template }) => {
  const nav = useNavigate();
  const [user] = useQueryUser();
  const { mutateAsync: deleteAsync } = useCertTemplateDelete();
  const l = useLocation();
  const confirm = useDynamicConfirmation();

  return (
    <Menu withArrow>
      <Menu.Target>
        <RowActionsButton />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconPencil size={14} />}
          onClick={(e) => {
            if (e.defaultPrevented) return;
            nav(`${template.id}${l.search}`, { relative: "path" });
          }}
        >
          Edit
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconTrash size={14} />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            confirm({
              children: (
                <Text>
                  Are you sure you want to delete the certificate template{" "}
                  <Text span fw="bold">
                    {template.friendly_name}?
                  </Text>
                </Text>
              ),
              onConfirm: async () => {
                await deleteAsync({ id: [template.id], user });
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
  );
};

const CertificateTemplates: FC = () => {
  const nav = useNavigate();
  const [user] = useQueryUser();
  const { data, status, error, refetch, isPlaceholderData, fetchStatus } =
    useCertTemplates({ user });
  const [selected, setSelected] = useState<RowSelectionState>({});
  const { mutateAsync: deleteAsync, isPending: isDeleting } =
    useCertTemplateDelete();
  const l = useLocation();
  const [globalFilter, setGlobalFilter] = useState<string>("");

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error") {
    return <DisplayError error={error} onReset={() => refetch()} />;
  }

  return (
    <Stack gap="sm" p="md" flex={1}>
      <FilterBar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        placeholder="Search templates"
      >
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => nav(`new${l.search}`, { relative: "path" })}
        >
          Add template
        </Button>
      </FilterBar>
      <Table
        highlightOnHover
        columns={columns}
        data={data}
        onRowSelectionChange={setSelected}
        enableRowSelection
        pagination
        paginationConfig={{
          showPageSizeChanger: true,
        }}
        rowSelection={selected}
        actionBarConfig={{
          cancelSelectionText: "Cancel",
          children: (
            <ButtonWithConfirm
              destructive
              loading={isDeleting}
              confirmBody="Are you sure you want to delete selected certificate templates?"
              confirmText="Delete"
              onConfirm={async () => {
                const ids = Object.keys(selected).map(
                  (id) => data[Number(id)].id,
                );
                try {
                  await deleteAsync({ id: ids, user });
                  return ok();
                } finally {
                  setSelected({});
                }
              }}
            >
              Delete
            </ButtonWithConfirm>
          ),
          selectAllText: "Select all",
          className: "",
        }}
        itemSingleText="template"
        itemPluralText="templates"
        initialState={{
          globalFilter,
        }}
        enableGlobalFilter
        loading={isPlaceholderData && fetchStatus === "fetching"}
      />
    </Stack>
  );
};

const Page: FC = () => {
  return (
    <>
      <PageLayout
        title="Certificate templates"
        subtitle="Used to generate CSRs"
        fullHeight={false}
      >
        <CertificateTemplates />
      </PageLayout>
      <Outlet />
    </>
  );
};

export { Page as CertificateTemplates };
