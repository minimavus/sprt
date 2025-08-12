import {
  IconAdjustmentsHorizontal,
  IconBook2,
  IconMessages,
  IconPlugConnected,
  IconServer2,
  IconSettingsBolt,
} from "@tabler/icons-react";
import type { FC } from "react";

import { usePermission } from "@/hooks/useUser";

import {
  iconProps,
  NavSubDivider,
  NavSubLink,
  NavSubSection,
} from "./NavSubLink";
import type { SubMenuComponentProps } from "./types";

const GlobalSettings: FC<SubMenuComponentProps> = ({ asMenu }) => {
  const can = usePermission("settings.read.global");

  if (!can) {
    return null;
  }

  return (
    <>
      <NavSubDivider asMenu={asMenu} />
      <NavSubSection asMenu={asMenu}>Global Settings</NavSubSection>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/global"
        prefix={<IconSettingsBolt {...iconProps} />}
      >
        Global Settings
      </NavSubLink>
    </>
  );
};

export const Settings: FC<SubMenuComponentProps> = ({ asMenu }) => {
  return (
    <>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/servers"
        prefix={<IconServer2 {...iconProps} />}
      >
        Servers
      </NavSubLink>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/preferences"
        prefix={<IconAdjustmentsHorizontal {...iconProps} />}
      >
        Generation Defaults
      </NavSubLink>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/api"
        prefix={<IconPlugConnected {...iconProps} />}
      >
        API
      </NavSubLink>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/sms-gateway"
        prefix={<IconMessages {...iconProps} />}
      >
        Mock SMS Gateway
      </NavSubLink>
      <NavSubLink
        asMenu={asMenu}
        href="/settings/dictionaries"
        prefix={<IconBook2 {...iconProps} />}
      >
        Dictionaries
      </NavSubLink>
      <GlobalSettings asMenu={asMenu} />
    </>
  );
};
