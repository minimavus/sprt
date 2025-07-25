import {
  ActionIcon,
  Box,
  getThemeColor,
  Menu,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconEye,
  IconPencil,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { RowActionsButton } from "@/components/Table/RowActionsButton";
import { FormatTime } from "@/components/Time";
import type { Certificate } from "@/hooks/certificates";
import { formatTime } from "@/utils/time";

import { useCertificateActions } from "./actionsContext";

export const columns: ColumnDef<Certificate>[] = [
  {
    id: "friendly_name",
    header: "Friendly name",
    accessorKey: "friendly_name",
    filterFn: "includesString",
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
    id: "issued_by",
    header: "Issued by",
    accessorKey: "issuer",
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
    cell: ({ row }) => <CertificateActions cert={row.original} />,
    size: 20,
    maxSize: 20,
    minSize: 20,
    enableColumnFilter: false,
  },
  {
    id: "expired",
    accessorKey: "is_expired",
    meta: {
      isHidden: true,
    },
  },
];

export const CertificateActions: FC<{
  cert: Certificate;
  pathPrefix?: string;
}> = ({ cert, pathPrefix }) => {
  const nav = useNavigate();
  const l = useLocation();
  const { deleteCertificates, renameCertificate, exportCertificates } =
    useCertificateActions();

  return (
    <ActionIcon.Group>
      <Tooltip label="Details" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Details"
          onClick={(e) => {
            if (e.defaultPrevented) return;
            nav(`${pathPrefix ? `${pathPrefix}/` : ""}${cert.id}${l.search}`, {
              relative: "path",
            });
          }}
        >
          <IconEye size={18} />
        </ActionIcon>
      </Tooltip>
      <Menu withArrow>
        <Menu.Target>
          <RowActionsButton />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconPencil size={14} />}
            onClick={(e) => {
              if (e.defaultPrevented) return;
              renameCertificate(cert);
            }}
          >
            Rename
          </Menu.Item>
          <Menu.Item
            leftSection={<IconUpload size={14} />}
            onClick={(e) => {
              if (e.defaultPrevented) return;
              exportCertificates([
                {
                  id: cert.id,
                  type: cert.type,
                },
              ]);
            }}
          >
            Export
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size={14} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteCertificates([
                {
                  id: cert.id,
                  type: cert.type,
                },
              ]);
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

export const ValidTill: FC<{ cert: Certificate }> = ({ cert }) => {
  const theme = useMantineTheme();
  const color = getThemeColor("orange", theme);
  return (
    <>
      {cert.is_expired ? (
        <Box component="span" mr="xs">
          <Tooltip label="Expired" withArrow>
            <IconAlertTriangle size={12} color={color} />
          </Tooltip>
        </Box>
      ) : null}

      <FormatTime t={cert.valid_to!} />
    </>
  );
};
