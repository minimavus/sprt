import { Button, Menu, VisuallyHidden } from "@mantine/core";
import { IconChevronDown, IconUserQuestion } from "@tabler/icons-react";
import { type FC, useState } from "react";

import { useActionsContext } from "../actionsContext";
import type { ActionsProps } from "../types";

export const GuestActions: FC<Pick<ActionsProps, "selected" | "collapsed">> = ({
  selected,
  collapsed,
}) => {
  const { guest } = useActionsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconUserQuestion size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          {collapsed ? <VisuallyHidden>Guest</VisuallyHidden> : "Guest"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            guest({ sessions: "all" });
          }}
        >
          Extract guest credentials of all sessions in bulk
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            guest({ sessions: "selected" });
          }}
          disabled={Object.keys(selected).length === 0}
        >
          Extract guest credentials of selected sessions
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
