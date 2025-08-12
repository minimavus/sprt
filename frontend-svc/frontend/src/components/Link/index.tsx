import {
  Anchor,
  type AnchorProps,
  Button,
  type ButtonProps,
} from "@mantine/core";
import { forwardRef, type PropsWithChildren } from "react";
import type { To } from "react-router-dom";

import { type FixedLinkProps, useFixedLink } from "./useFixedLink";

type Props = PropsWithChildren<
  Omit<AnchorProps, keyof FixedLinkProps> & FixedLinkProps & { to: To }
>;

export const Link = forwardRef<HTMLAnchorElement, Props>(
  ({ onClick, replace = false, state, target, to, ...rest }, ref) => {
    const fixedLink = useFixedLink(to, { replace, state, target, onClick });

    return <Anchor {...rest} {...fixedLink} ref={ref} />;
  },
);

type LinkButtonProps = ButtonProps & { to: To } & FixedLinkProps;

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      onClick,
      replace = false,
      state,
      target,
      to,
      size = "compact-sm",
      variant = "subtle",
      ...rest
    },
    ref,
  ) => {
    const fixedLink = useFixedLink(to, { replace, state, target, onClick });

    return (
      <Button
        size={size}
        variant={variant}
        component="a"
        {...rest}
        {...fixedLink}
        ref={ref}
      />
    );
  },
);
