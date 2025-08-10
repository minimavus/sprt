import { ActionIcon, ButtonGroup, Menu, Tooltip } from "@mantine/core";
import {
  IconCancel,
  IconClockPlay,
  IconTrash,
  IconUserQuestion,
  IconWaveSine,
} from "@tabler/icons-react";
import type { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { RowActionsButton } from "@/components/Table/RowActionsButton";
import type { RadiusSession } from "@/hooks/sessions/schemas";

import { useActionsContext } from "../actionsContext";

export const DetailsCell: FC<{ row: RadiusSession }> = ({ row }) => {
  const nav = useNavigate();
  const l = useLocation();
  const { guest, interimUpdate, drop, remove } = useActionsContext();

  const hasGuestData =
    row.attributes?.snapshot?.GUEST_FLOW !== null &&
    typeof row.attributes?.snapshot?.GUEST_FLOW === "object" &&
    Object.keys(row.attributes?.snapshot?.GUEST_FLOW).length > 0;

  return (
    <ButtonGroup>
      <Tooltip label="Flow" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Actions"
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
          {hasGuestData ? (
            <Menu.Item
              leftSection={<IconUserQuestion size={14} />}
              onClick={(e) => {
                if (e.defaultPrevented) return;
                guest({ sessions: [row.id] });
              }}
            >
              Guest data
            </Menu.Item>
          ) : null}
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconClockPlay size={14} />}
            onClick={() => {
              interimUpdate({ sessions: [row.id] });
            }}
          >
            Send Interim-Update
          </Menu.Item>
          <Menu.Item
            leftSection={<IconCancel size={14} />}
            onClick={() => {
              drop({ sessions: [row.id] });
            }}
          >
            Drop
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconTrash size={14} />}
            onClick={() => {
              remove({ sessions: [row.id] });
            }}
            color="red"
          >
            Remove
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </ButtonGroup>
  );
};
