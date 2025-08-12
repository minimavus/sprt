import { IconEraser, IconLogs } from "@tabler/icons-react";
import type { FC } from "react";

import { usePermission } from "@/hooks/useUser";

import { iconProps, NavSubLink } from "./NavSubLink";
import type { SubMenuComponentProps } from "./types";

export const Tools: FC<SubMenuComponentProps> = ({ asMenu }) => {
  const canAccessLogs = usePermission("logs.owners.get_all");
  const canAccessCleanups = usePermission("cleanup.access");

  return (
    <>
      {canAccessCleanups && <CleanupLink asMenu={asMenu} />}
      {canAccessLogs && <LogsLink asMenu={asMenu} />}
    </>
  );
};

function CleanupLink({ asMenu }: SubMenuComponentProps) {
  return (
    <NavSubLink
      asMenu={asMenu}
      prefix={<IconEraser {...iconProps} />}
      href="/cleanup"
    >
      Clean Ups
    </NavSubLink>
  );
}

function LogsLink({ asMenu }: SubMenuComponentProps) {
  return (
    <NavSubLink
      asMenu={asMenu}
      prefix={<IconLogs {...iconProps} />}
      href="/logs"
    >
      Logs
    </NavSubLink>
  );
}
