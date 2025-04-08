import { forwardRef, type ReactNode } from "react";
import { Box, BoxProps, PolymorphicComponentProps, rem } from "@mantine/core";
import cx from "classnames";

import styles from "./Timeline.module.scss";

const spacingSizes = {
  xs: "var(--mantine-spacing-xs)",
  sm: "var(--mantine-spacing-sm)",
  md: "var(--mantine-spacing-md)",
  lg: "var(--mantine-spacing-lg)",
  xl: "var(--mantine-spacing-xl)",
} as const;

type GapSize =
  | keyof typeof spacingSizes
  | 0
  | 2
  | 4
  | 8
  | 12
  | 16
  | 24
  | 36
  | 48;

export type TimelineElementStatus =
  | "positive"
  | "warning"
  | "severe-warning"
  | "negative"
  | "info"
  | "dormant";

type TimelineElementProps = {
  children?: ReactNode;
  icon: ReactNode;
  status?: TimelineElementStatus;
} & PolymorphicComponentProps<"div", BoxProps>;

export const TimelineElement = forwardRef<HTMLDivElement, TimelineElementProps>(
  ({ children, icon, status, className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cx(
          styles["timeline__element"],
          {
            [styles["positive"]]: status === "positive",
            [styles["warning"]]: status === "warning",
            [styles["severe-warning"]]: status === "severe-warning",
            [styles["negative"]]: status === "negative",
            [styles["info"]]: status === "info",
            [styles["dormant"]]: status === "dormant",
          },
          className,
        )}
        {...props}
      >
        <div className={cx(styles["timeline__icon"])}>
          <div className={cx(styles["icon"])}>{icon}</div>
        </div>
        <div>{children}</div>
      </Box>
    );
  },
);

type TimelineProps = {
  children?: ReactNode;
  gap?: GapSize;
} & PolymorphicComponentProps<"div", BoxProps>;

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className, gap = 8, style, ...props }, ref) => {
    const gapValue = typeof gap === "string" ? spacingSizes[gap] : gap;

    return (
      <Box
        ref={ref}
        component="div"
        className={cx(styles["timeline"], className)}
        style={[
          style,
          {
            gap: typeof gap === "number" ? rem(gap) : gapValue,
            "--timeline-gap": typeof gap === "number" ? rem(gap) : gapValue,
          },
        ]}
        {...props}
      >
        {children}
      </Box>
    );
  },
);
