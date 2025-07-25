import { Text } from "@mantine/core";
import cx from "classnames";
import type { FC, HTMLProps } from "react";

import styles from "./styles.module.scss";

type HowItWorksProps = HTMLProps<HTMLDivElement>;

export const HowItWorks: FC<HowItWorksProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cx(styles["how-it-works"], className)} {...props}>
      <Text c="dimmed" span>
        How it works:
      </Text>
      {typeof children === "string" ? <Text span>{children}</Text> : children}
    </div>
  );
};
