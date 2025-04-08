import { type FC } from "react";
import { ActionIcon, Button, Menu, Stack, Tooltip } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { IconKey, IconTrash, IconWaveSine } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";

import { KeyValue } from "@/components/KeyValue";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { RowActionsButton } from "@/components/Table/RowActionsButton";
import { TacacsSession } from "@/hooks/sessions/schemas";

const fields = {
  USERNAME: "Username",
  PASSWORD: "Password",
  NEW_PASSWORD: "New password",
} as const;

const ShowCredentials: FC<{ row: TacacsSession }> = ({ row }) => {
  const { openModal, closeModal } = useModals();

  const hasCredentials = row?.attributes?.snapshot
    ? Object.keys(row.attributes.snapshot).some((key) => key in fields)
    : false;

  return (
    <Menu.Item
      leftSection={<IconKey size={14} />}
      disabled={!hasCredentials}
      onClick={() => {
        const id = openModal({
          title: "Credentials",
          children: (
            <Stack gap="xs">
              <KeyValue
                pairs={Object.entries(fields).map(([key, label]) => [
                  label,
                  row.attributes.snapshot[key],
                ])}
              />
              <ModalFooter>
                <Button
                  type="button"
                  onClick={() => {
                    closeModal(id);
                  }}
                  variant="default"
                >
                  Close
                </Button>
              </ModalFooter>
            </Stack>
          ),
          size: "md",
        });
      }}
    >
      Show credentials
    </Menu.Item>
  );
};

export const DetailsCell: FC<{ row: TacacsSession }> = ({ row }) => {
  const nav = useNavigate();
  const l = useLocation();
  const confirm = useDynamicConfirmation();

  return (
    <ActionIcon.Group>
      <Tooltip label="Flow" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Flow"
          onClick={(e) => {
            if (e.defaultPrevented) return;
            nav(`${row.id}${l.search}`, { relative: "path" });
          }}
        >
          <IconWaveSine size={18} />
        </ActionIcon>
      </Tooltip>
      <Menu withArrow>
        <Menu.Target>
          <RowActionsButton />
        </Menu.Target>
        <Menu.Dropdown>
          <ShowCredentials row={row} />
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size={14} />}
            onClick={() => {
              confirm({
                confirmText: "Delete",
                title: "Delete session",
                onConfirm: async () => {
                  console.log("TODO: Delete");
                },
                children: "Are you sure you want to delete this session?",
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
