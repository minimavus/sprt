import { useState, type FC } from "react";
import { Button, Menu, VisuallyHidden } from "@mantine/core";
import { IconCancel, IconChevronDown } from "@tabler/icons-react";

import { useActionsContext } from "../actionsContext";
import { ActionsProps } from "../types";

export const DropActions: FC<Pick<ActionsProps, "selected" | "collapsed">> = ({
  selected,
  collapsed,
}) => {
  const { drop } = useActionsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconCancel size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          {collapsed ? <VisuallyHidden>Drop</VisuallyHidden> : "Drop"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            drop({ sessions: "all" });
          }}
        >
          Drop all sessions in bulk
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            drop({ sessions: "selected" });
          }}
          disabled={Object.keys(selected).length === 0}
        >
          Drop selected sessions
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
