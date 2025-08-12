import type {
  PolymorphicComponentProps,
  UnstyledButtonProps,
} from "@mantine/core";
import type { IconAtom2 } from "@tabler/icons-react";
import type { ComponentType, HTMLAttributeAnchorTarget, Ref } from "react";

export interface SubMenuComponentProps {
  asMenu: boolean;
}

export interface NavbarLinkProps {
  icon: typeof IconAtom2;
  label?: string;
  active?: boolean;
  href?: string;
  onClick?: (event: React.MouseEvent<any, MouseEvent>) => void;
  target?: HTMLAttributeAnchorTarget | undefined;
  subMenu?: ComponentType<SubMenuComponentProps>;
  collapsed: boolean;
  buttonProps?: PolymorphicComponentProps<any, UnstyledButtonProps>;
  ref?: Ref<HTMLElement>;
}
