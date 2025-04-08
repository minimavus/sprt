import { useState, type FC } from "react";
import { Button, Menu, VisuallyHidden } from "@mantine/core";
import { IconChevronDown, IconClockPlay } from "@tabler/icons-react";

import { useActionsContext } from "../actionsContext";
import { ActionsProps } from "../types";

export const AccountingActions: FC<
  Pick<ActionsProps, "selected" | "collapsed">
> = ({ selected, collapsed }) => {
  const { interimUpdate } = useActionsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconClockPlay size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          {collapsed ? (
            <VisuallyHidden>Accounting</VisuallyHidden>
          ) : (
            "Accounting"
          )}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            interimUpdate({
              sessions: "all",
            });
          }}
        >
          Send Interim-Update on all sessions in bulk
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            interimUpdate({
              sessions: "selected",
            });
          }}
          disabled={Object.keys(selected).length === 0}
        >
          Send Interim-Update on selected sessions
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
