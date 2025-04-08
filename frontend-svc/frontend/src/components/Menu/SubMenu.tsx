import { FC, PropsWithChildren, ReactNode } from "react";
import { Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronRight } from "@tabler/icons-react";

import styles from "./styles.module.scss";

export const SubMenu: FC<PropsWithChildren<{ label?: ReactNode }>> = ({
  children,
  label,
}) => {
  const [hovered, { open, close }] = useDisclosure();

  return (
    <Menu
      position="right-start"
      trigger="hover"
      offset={4}
      onOpen={open}
      onClose={close}
    >
      <Menu.Target>
        <Menu.Item
          onMouseEnter={open}
          data-sub-hovered={hovered ? "true" : undefined}
          className={styles.item}
          rightSection={<IconChevronRight size={14} />}
        >
          {label}
        </Menu.Item>
      </Menu.Target>
      <Menu.Dropdown p={5}>{children}</Menu.Dropdown>
    </Menu>
  );
};
