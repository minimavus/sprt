import { forwardRef, ReactNode } from "react";
import {
  Box,
  BoxComponentProps,
  GroupProps,
  MantineSize,
  MantineStyleProp,
  PolymorphicComponentProps,
} from "@mantine/core";
import cx from "classnames";

import styles from "./KeyValue.module.scss";

type KeyValueProps = {
  pairs: [ReactNode, ReactNode][];
  kw?: number;
  justifyKeys?: GroupProps["justify"];
  gap?: GroupProps["gap"];
  placement?: "above" | "side";
} & PolymorphicComponentProps<"dl", BoxComponentProps>;

const setOfMantineSpacing = new Set(["xs", "sm", "md", "lg", "xl"]);

const isMantineSpacing = (gap: string): gap is MantineSize => {
  return setOfMantineSpacing.has(gap);
};

const addCssVariables = (
  { kw, gap }: Pick<KeyValueProps, "kw" | "gap">,
  style: MantineStyleProp,
): MantineStyleProp[] => {
  const styles: MantineStyleProp[] = [];
  if (kw !== undefined) {
    styles.push({ "--key-value-key-width": `${kw}px` });
  }
  if (gap !== undefined) {
    if (gap === "none") {
      styles.push({ "--gap": "0" });
    } else if (typeof gap === "number") {
      styles.push({ "--gap": `${gap}px` });
    } else if (isMantineSpacing(gap)) {
      styles.push({ "--gap": `var(--mantine-spacing-${gap})` });
    } else {
      styles.push({ "--gap": gap });
    }
  }
  return [...styles, style];
};

export const KeyValue = forwardRef<HTMLDListElement, KeyValueProps>(
  (
    {
      pairs,
      className,
      kw,
      style,
      justifyKeys,
      fz = "sm",
      gap = "xs",
      placement = "side",
      ...props
    },
    ref,
  ) => {
    justifyKeys =
      (justifyKeys ?? placement === "above") ? "flex-start" : "flex-end";
    return (
      <Box
        component="dl"
        className={cx(styles.key_value, className, {
          [styles["placement-above"]]: placement === "above",
        })}
        style={addCssVariables({ kw, gap }, style)}
        fz={fz}
        {...props}
        ref={ref}
      >
        {pairs.map(([dt, dd], i) => (
          <Box component="div" key={i} className={styles.key_value_pair}>
            <Box
              component="dt"
              style={{ justifyContent: justifyKeys }}
              className={styles.key}
            >
              {dt}
            </Box>
            <Box component="dd" className={styles.value}>
              {dd}
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
);
