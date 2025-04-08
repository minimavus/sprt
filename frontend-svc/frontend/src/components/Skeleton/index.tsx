import { FC } from "react";
import { Skeleton, SkeletonProps, useMantineTheme } from "@mantine/core";

type SkeletonLinesProps = {
  x: number;
  lastIsShort?: boolean;
} & SkeletonProps;

export const SkeletonLines: FC<SkeletonLinesProps> = ({
  x,
  lastIsShort,
  radius = "xl",
  mb = "sm",
  height,
  ...props
}) => {
  const theme = useMantineTheme();
  if (typeof height === "string" && height in theme.spacing) {
    height = theme.spacing[height];
  } else {
    height = height ?? theme.spacing.md;
  }

  return Array.from({ length: x }).map((_, i) => (
    <Skeleton
      key={i}
      height={height}
      radius={radius}
      mb={i === x - 1 ? 0 : mb}
      width={i === x - 1 && lastIsShort ? "75%" : props.width}
      {...props}
    />
  ));
};
