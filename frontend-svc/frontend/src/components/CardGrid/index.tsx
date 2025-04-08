import { FC, PropsWithChildren } from "react";
import { Box } from "@mantine/core";
import cx from "classnames";

import styles from "@/components/CardGrid/CardGrid.module.scss";

export { styles };

type CardGridProps = {
  arranged?: boolean;
  minCardWidth?: string | number;
};

export const CardGrid: FC<PropsWithChildren<CardGridProps>> = ({
  arranged,
  children,
  minCardWidth,
}) => {
  return (
    <Box
      className={cx(styles.card_grid, {
        [styles["card_grid--arranged"]]: arranged,
      })}
      __vars={{
        "--card-min-width":
          minCardWidth !== undefined
            ? typeof minCardWidth === "string"
              ? minCardWidth
              : `${minCardWidth}px`
            : undefined,
      }}
    >
      {children}
    </Box>
  );
};
