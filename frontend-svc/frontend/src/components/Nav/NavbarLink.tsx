import {
  Box,
  Collapse,
  Group,
  Menu,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

import classes from "./styles.module.scss";
import type { NavbarLinkProps } from "./types";

export function NavbarLink({
  icon: Icon,
  label,
  active,
  onClick,
  subMenu: El,
  collapsed,
  href,
  target,
  buttonProps,
  ref,
}: NavbarLinkProps) {
  const hasLinks = Boolean(El);
  const [opened, setOpened] = useState(active || false);

  if (collapsed) {
    if (El) {
      return (
        <Menu
          width={280}
          shadow="md"
          position="right-start"
          withinPortal
          trigger="click-hover"
          transitionProps={{ transition: "fade-right" }}
          openDelay={100}
        >
          <Menu.Target>
            <UnstyledButton
              onClick={() => setOpened((o) => !o)}
              className={classes.link}
              data-active={active || undefined}
              {...buttonProps}
            >
              <Icon size={24} stroke={1.5} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <El asMenu />
          </Menu.Dropdown>
        </Menu>
      );
    }

    const Btn = (
      <UnstyledButton
        onClick={onClick}
        className={classes.link}
        data-active={active || undefined}
        component={hasLinks ? "button" : "a"}
        href={hasLinks ? undefined : href}
        target={hasLinks ? undefined : target}
        ref={ref}
        {...buttonProps}
      >
        <Icon size={24} stroke={1.5} />
      </UnstyledButton>
    );

    return label ? (
      <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
        {Btn}
      </Tooltip>
    ) : (
      Btn
    );
  }

  return (
    <>
      <UnstyledButton
        onClick={hasLinks ? () => setOpened((o) => !o) : onClick}
        className={classes.control}
        component={hasLinks ? "button" : "a"}
        href={hasLinks ? undefined : href}
        target={hasLinks ? undefined : target}
        data-active={hasLinks ? undefined : active || undefined}
        ref={ref}
        {...buttonProps}
      >
        <Group justify="space-between" gap={0}>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <ThemeIcon variant="light" size={30}>
              <Icon size={18} />
            </ThemeIcon>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              size={16}
              style={{ transform: opened ? "rotate(-90deg)" : "none" }}
            />
          )}
        </Group>
      </UnstyledButton>
      {El ? (
        <Collapse in={opened} w="100%">
          <El asMenu={false} />
        </Collapse>
      ) : null}
    </>
  );
}
