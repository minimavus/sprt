import { Button, Menu, VisuallyHidden } from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import { type FC, useState } from "react";

import { useActionsContext } from "../actionsContext";
import type { ActionsProps } from "../types";

export const RemoveActions: FC<
  Pick<ActionsProps, "selected" | "collapsed">
> = ({ selected, collapsed }) => {
  const { remove } = useActionsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          variant="outline"
          color="red"
          leftSection={<IconTrash size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          {collapsed ? <VisuallyHidden>Delete</VisuallyHidden> : "Delete"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            remove({ sessions: "all" });
          }}
        >
          Delete all sessions in bulk
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            remove({ sessions: "selected" });
          }}
          disabled={Object.keys(selected).length === 0}
        >
          Delete selected sessions
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            remove({ sessions: "dropped-failed" });
          }}
        >
          Delete dropped & failed sessions
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            remove({ sessions: "older-than-5-days" });
          }}
        >
          Delete sessions older than 5 days
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
