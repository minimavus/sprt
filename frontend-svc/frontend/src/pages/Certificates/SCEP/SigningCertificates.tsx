import { FC, useState } from "react";
import { Box, Button, Group, Paper, Stack, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";

import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { CheckboxColumnId, Table } from "@/components/Table";
import { FormatTime } from "@/components/Time";
import { Certificate, useCertificatesOfType } from "@/hooks/certificates";
import { useQueryUser } from "@/hooks/useQueryUser";
import { formatTime } from "@/utils/time";

import { ActionsProvider, useCertificateActions } from "../actionsContext";
import { CertificateActions, ValidTill } from "../table";

const columns: ColumnDef<Certificate>[] = [
  {
    id: "friendly_name",
    header: "Friendly name",
    accessorKey: "friendly_name",
    size: undefined,
  },
  {
    id: "subject",
    header: "Subject",
    accessorKey: "subject",
    filterFn: "includesString",
    size: undefined,
  },
  {
    id: "valid_from",
    header: "Valid from",
    accessorFn: (row) => formatTime(row.valid_from!),
    enableColumnFilter: false,
    cell: ({ row }) => <FormatTime t={row.original.valid_from} />,
    size: undefined,
  },
  {
    id: "valid_till",
    header: "Valid till",
    accessorFn: (row) => formatTime(row.valid_to!),
    enableColumnFilter: false,
    cell: ({ row }) => <ValidTill cert={row.original} />,
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
    cell: ({ row }) => (
      <CertificateActions
        cert={row.original}
        pathPrefix="signing-certificates"
      />
    ),
    size: 20,
    maxSize: 20,
    minSize: 20,
    enableColumnFilter: false,
  },
];

const SCEPSigningCertificates: FC = () => {
  const [user] = useQueryUser();
  const { data, error, status, isPlaceholderData, fetchStatus } =
    useCertificatesOfType("signer", {
      user,
    });
  const [selected, setSelected] = useState<RowSelectionState>({});
  const { deleteCertificates, exportCertificates } = useCertificateActions();

  return (
    <ActionsProvider>
      <Box>
        <Box mb="md">
          <Title order={1}>SCEP Signing Certificates</Title>
          <Title size="xs">
            Certificates used to sign CSRs sent to a SCEP server
          </Title>
        </Box>
        <Paper radius="md" withBorder p="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  console.log("TODO: Add SCEP Signing Certificate");
                }}
              >
                Add SCEP Signing Certificate
              </Button>
            </Group>
            {status === "pending" ? (
              <DefaultLoaderFallback />
            ) : status === "error" ? (
              <DisplayError error={error} />
            ) : (
              <Table
                highlightOnHover
                columns={columns}
                data={data.certificates}
                onRowSelectionChange={setSelected}
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
                              type: "signer",
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
                              type: "signer",
                            })),
                          );
                        }}
                        variant="outline"
                      >
                        Export
                      </Button>
                    </>
                  ),
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
            )}
          </Stack>
        </Paper>
      </Box>
    </ActionsProvider>
  );
};

const HOC = () => {
  return (
    <ActionsProvider>
      <SCEPSigningCertificates />
    </ActionsProvider>
  );
};

export { HOC as SCEPSigningCertificates };
