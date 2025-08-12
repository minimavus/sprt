import { type BurgerProps, Divider, Stack } from "@mantine/core";
import {
  IconAtom2,
  IconCertificate,
  IconChartArrows,
  IconList,
  IconLocationPlus,
  IconSettings,
  IconTools,
} from "@tabler/icons-react";
import type { FC } from "react";
import { useLocation } from "react-router-dom";

import { useFixedLink } from "@/components/Link/useFixedLink";
import { useAllUserAttributes, usePermission } from "@/hooks/useUser";

import { OurBurger } from "../Header/OurBurger";
import { Certificates } from "./Certificates";
import { Generate } from "./Generate";
import { NavbarLink } from "./NavbarLink";
import { Sessions } from "./Sessions";
import { Settings } from "./Settings";
import { SwitchUser } from "./SwitchUser";
import classes from "./styles.module.scss";
import { Tools } from "./Tools";

export { NavbarLink };

const openedBurperProps: BurgerProps = {
  ml: "sm",
  style: { alignSelf: "flex-start" },
};

const Nav: FC = () => {
  const { pathname } = useLocation();
  const canAccessLogs = usePermission("logs.owners.get_all");
  const canAccessCleanups = usePermission("cleanup.access");
  const canSwitchUser = usePermission("users.switch");
  const { data: attributes } = useAllUserAttributes();
  const collapsed = attributes?.ui?.collapseMenu ?? false;

  return (
    <>
      <Stack align="center" pt="lg" gap="0" className={classes.nav} flex={1}>
        <OurBurger
          alwaysVisible
          mb="sm"
          {...(!collapsed ? openedBurperProps : {})}
        />
        <NavbarLink
          icon={IconLocationPlus}
          label="Generate"
          active={pathname.startsWith("/generate")}
          subMenu={Generate}
          collapsed={collapsed}
        />
        <NavbarLink
          icon={IconAtom2}
          label="pxGrid"
          active={pathname.startsWith("/pxgrid")}
          {...useFixedLink("/pxgrid", { target: "_self" })}
          collapsed={collapsed}
        />
        <NavbarLink
          icon={IconList}
          label="Sessions"
          active={pathname.startsWith("/sessions")}
          collapsed={collapsed}
          subMenu={Sessions}
        />
        <NavbarLink
          icon={IconChartArrows}
          label="Jobs"
          active={pathname.startsWith("/jobs")}
          {...useFixedLink("/jobs", { target: "_self" })}
          collapsed={collapsed}
        />
        <NavbarLink
          icon={IconCertificate}
          label="Certificates"
          active={pathname.startsWith("/cert")}
          collapsed={collapsed}
          subMenu={Certificates}
        />
        <NavbarLink
          icon={IconSettings}
          label="Settings"
          active={pathname.startsWith("/settings")}
          collapsed={collapsed}
          subMenu={Settings}
        />
        {canAccessCleanups || canAccessLogs ? (
          <NavbarLink
            icon={IconTools}
            label="Tools"
            active={
              pathname.startsWith("/cleanup") || pathname.startsWith("/logs")
            }
            collapsed={collapsed}
            subMenu={Tools}
          />
        ) : null}
      </Stack>
      {canSwitchUser ? (
        <Stack className={classes.nav} align="center" pb="lg">
          <Divider w="calc(100% - 2vw)" />
          <SwitchUser collapsed={collapsed} />
        </Stack>
      ) : null}
    </>
  );
};

export default Nav;
