import { useState, type FC } from "react";
import { Button, Menu, VisuallyHidden } from "@mantine/core";
import { IconChevronDown, IconFingerprint } from "@tabler/icons-react";

import { useActionsContext } from "../actionsContext";
import { ActionsProps } from "../types";

export const ANCActions: FC<Pick<ActionsProps, "selected" | "collapsed">> = ({
  selected,
  collapsed,
}) => {
  const { policies } = useActionsContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Menu
      onOpen={() => setIsMenuOpen(true)}
      onClose={() => setIsMenuOpen(false)}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconFingerprint size={16} />}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
          disabled={Object.keys(selected).length === 0}
        >
          {collapsed ? <VisuallyHidden>ANC</VisuallyHidden> : "ANC"}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          onClick={() => {
            policies({ subaction: "get-applied" });
          }}
        >
          Get policies applied to EndPoint
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            policies({ subaction: "apply", by: "ip" });
          }}
        >
          Apply policy by IP
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            policies({ subaction: "apply", by: "mac" });
          }}
        >
          Apply policy by MAC
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => {
            policies({ subaction: "clear", by: "ip" });
          }}
        >
          Clear policy by IP
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            policies({ subaction: "clear", by: "mac" });
          }}
        >
          Clear policy by MAC
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
