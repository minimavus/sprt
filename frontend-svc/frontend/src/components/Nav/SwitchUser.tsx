import { FC } from "react";
import { IconSwitchHorizontal } from "@tabler/icons-react";

import { NavbarLink } from "./NavbarLink";
import { NavbarLinkProps } from "./types";

type SwitchUserProps = Omit<NavbarLinkProps, "icon" | "label">;

export const SwitchUser: FC<SwitchUserProps> = (props) => {
  return (
    <NavbarLink icon={IconSwitchHorizontal} label="Switch User" {...props} />
  );
};
