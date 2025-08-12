import { Group, type GroupProps, rem } from "@mantine/core";
import cx from "classnames";
import type { FC } from "react";

interface ModalFooterProps extends GroupProps {
  stickyBottom?: boolean;
}

export const ModalFooter: FC<ModalFooterProps> = ({
  children,
  justify = "flex-end",
  flex = "grow",
  className,
  pos,
  bottom,
  stickyBottom = false,
  bg,
  mb,
  pb,
  pt,
  style,
  ...props
}) => {
  pos = stickyBottom ? "sticky" : pos;
  bottom = stickyBottom ? 0 : bottom;
  bg = stickyBottom ? "var(--mantine-color-body)" : bg;
  mb = stickyBottom ? rem(-16) : mb;
  pb = stickyBottom ? rem(16) : pb;
  pt = stickyBottom ? rem(16) : pt;
  style = stickyBottom ? [{ zIndex: 2 }, style] : style;

  return (
    <Group
      justify={justify}
      flex={flex}
      className={cx("modal-footer", className)}
      pos={pos}
      bottom={bottom}
      bg={bg}
      mb={mb}
      pb={pb}
      pt={pt}
      style={style}
      {...props}
    >
      {children}
    </Group>
  );
};
