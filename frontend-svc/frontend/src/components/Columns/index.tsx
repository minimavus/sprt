import { forwardRef, type FC, type ReactNode } from "react";
import {
  Box,
  BoxComponentProps,
  Grid,
  GridColProps,
  GridProps,
  PolymorphicComponentProps,
  Title,
  TitleProps,
} from "@mantine/core";
import cx from "classnames";

import styles from "./styles.module.scss";

export const ColumnHeading: FC<TitleProps> = ({ children, ...props }) => {
  return (
    <Title order={2} {...props}>
      {children}
    </Title>
  );
};

interface ColumnsProps extends GridProps {
  children: ReactNode;
  withBorder?: boolean;
}

export const Columns: FC<ColumnsProps> = ({
  w = "100%",
  display = "flex",
  overflow = "hidden",
  className,
  children,
  withBorder = true,
  ...props
}) => {
  return (
    <Grid
      w={w}
      display={display}
      overflow={overflow}
      {...props}
      className={cx(styles.columns, className, {
        [styles["with-borders"]]: withBorder,
      })}
    >
      {children}
    </Grid>
  );
};

export const Left: FC<GridColProps & { heading?: ReactNode }> = ({
  className,
  heading,
  children,
  ...props
}) => {
  return (
    <Grid.Col span={3} {...props} className={cx(styles.left, className)}>
      {heading ? <ColumnHeading>{heading}</ColumnHeading> : null}
      {children}
    </Grid.Col>
  );
};

export const Right: FC<GridColProps & { heading?: ReactNode }> = ({
  className,
  heading,
  children,
  ...props
}) => {
  return (
    <Grid.Col span={9} {...props} className={cx(styles.right, className)}>
      {heading ? <ColumnHeading>{heading}</ColumnHeading> : null}
      {children}
    </Grid.Col>
  );
};

export const ColumnSection = forwardRef<
  HTMLDivElement,
  PolymorphicComponentProps<"div", BoxComponentProps>
>(({ children, className, ...props }, ref) => {
  return (
    <Box
      component="div"
      ref={ref}
      className={cx(styles.section, className)}
      {...props}
    >
      {children}
    </Box>
  );
});
