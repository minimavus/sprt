import { FC, PropsWithChildren, ReactNode } from "react";
import { Menu, Text } from "@mantine/core";
import { IconProps } from "@tabler/icons-react";
import { useLocation } from "react-router-dom";

import { useFixedLink } from "../Link/useFixedLink";
import classes from "./styles.module.scss";

export const iconProps: IconProps = {
  size: 18,
  stroke: 1.5,
};

type NavSubLinkProps = PropsWithChildren<{
  href: string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  active?: boolean;
  asMenu: boolean;
}>;

export const NavSubLink: FC<NavSubLinkProps> = ({
  children,
  href,
  suffix,
  prefix,
  active,
  asMenu,
}) => {
  const { pathname } = useLocation();
  const linkProps = useFixedLink(href);

  active = active !== undefined ? active : pathname.startsWith(href);

  if (asMenu) {
    return (
      <Menu.Item
        component="a"
        {...linkProps}
        data-active={active ? "true" : undefined}
        leftSection={prefix}
        rightSection={suffix}
      >
        <span>{children}</span>
      </Menu.Item>
    );
  }

  return (
    <Text<"a">
      component="a"
      className={classes.link_full}
      {...linkProps}
      data-active={active ? "true" : undefined}
    >
      {prefix ? prefix : null}
      <span>{children}</span>
      {suffix ? suffix : null}
    </Text>
  );
};

export const NavSubSection: FC<{
  children?: ReactNode | undefined;
  asMenu: boolean;
}> = ({ children, asMenu }) => {
  if (asMenu) {
    return <Menu.Label>{children}</Menu.Label>;
  }

  return (
    <Text<"span"> component="span" className={classes.section}>
      {children}
    </Text>
  );
};

export const NavSubDivider: FC<{ asMenu: boolean }> = ({ asMenu }) => {
  if (asMenu) {
    return <Menu.Divider />;
  }

  return null;
};
