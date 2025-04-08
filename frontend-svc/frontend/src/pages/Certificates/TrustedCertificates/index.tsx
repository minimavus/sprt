import { useState, type FC } from "react";
import { Button, Checkbox, Menu, Stack } from "@mantine/core";
import {
  IconBarcode,
  IconChevronDown,
  IconFileUpload,
  IconPlus,
} from "@tabler/icons-react";
import { type RowSelectionState } from "@tanstack/react-table";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { CheckboxColumnId, Table } from "@/components/Table";
import { FilterBar } from "@/components/Table/FilterBar";
import { useCertificatesOfType, type CertType } from "@/hooks/certificates";
import { useQueryUser } from "@/hooks/useQueryUser";

import { ActionsProvider, useCertificateActions } from "../actionsContext";
import { columns } from "../table";

const TrustedCertificates: FC = () => {
  const [qu] = useQueryUser();
  const { data, status, error, refetch, isPlaceholderData, fetchStatus } =
    useCertificatesOfType("trusted", {
      user: qu,
    });
  const [selected, setSelected] = useState<RowSelectionState>({});
  const { deleteCertificates, exportCertificates } = useCertificateActions();
  const nav = useNavigate();
  const l = useLocation();
  const [expiredOnly, setExpiredOnly] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error") {
    return <DisplayError error={error} onReset={() => refetch()} />;
  }

  return (
    <Stack gap="sm" p="md" flex={1} miw={0}>
      <FilterBar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        keyFilterChildren={
          <Checkbox
            checked={expiredOnly}
            onChange={(e) => setExpiredOnly(e.target.checked)}
            label="Expired only"
          />
        }
        placeholder="Search certificates"
      >
        <Menu
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
        >
          <Menu.Target>
            <Button
              leftSection={<IconPlus size={16} />}
              rightSection={
                <IconChevronDown
                  size={14}
                  style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
                />
              }
            >
              Add certificate
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              onClick={() => nav(`upload${l.search}`, { relative: "path" })}
              leftSection={<IconFileUpload size={14} />}
            >
              Import from file
            </Menu.Item>
            <Menu.Item
              onClick={() => nav(`import${l.search}`, { relative: "path" })}
              leftSection={<IconBarcode size={14} />}
            >
              Import from PEM text
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </FilterBar>
      <Table
        highlightOnHover
        columns={columns}
        columnFilters={[
          ...(expiredOnly ? [{ id: "expired", value: true }] : []),
        ]}
        data={data.certificates}
        onRowSelectionChange={setSelected}
        pagination
        paginationConfig={{
          showPageSizeChanger: true,
        }}
        rowSelection={selected}
        enableRowSelection
        actionBarConfig={{
          cancelSelectionText: "Cancel",
          children: (
            <>
              <Button
                color="red"
                onClick={() => {
                  deleteCertificates(
                    Object.keys(selected).map((id) => ({
                      id: data.certificates[Number(id)].id,
                      type: "trusted" as CertType,
                    })),
                    {
                      onSuccess: () => {
                        setSelected({});
                      },
                    },
                  );
                }}
                type="button"
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  exportCertificates(
                    Object.keys(selected).map((id) => ({
                      id: data.certificates[Number(id)].id,
                      type: "trusted" as CertType,
                    })),
                  );
                }}
                variant="outline"
              >
                Export
              </Button>
            </>
          ),
          itemsSelectedText: "Selected items",
          selectAllText: "Select all",
          className: "",
        }}
        loading={isPlaceholderData && fetchStatus === "fetching"}
        itemSingleText="certificate"
        itemPluralText="certificates"
        enableColumnPinning
        columnPinningState={{
          left: [CheckboxColumnId],
          right: ["actions"],
        }}
      />
    </Stack>
  );
};

const Page: FC = () => {
  return (
    <>
      <PageLayout
        title="Trusted certificates"
        subtitle="Used to verify a RADIUS server certificate during PEAP/EAP-TLS"
        fullHeight={false}
      >
        <ActionsProvider>
          <TrustedCertificates />
        </ActionsProvider>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { Page as TrustedCertificates };
