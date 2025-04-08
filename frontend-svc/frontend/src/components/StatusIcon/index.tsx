import { FC } from "react";
import { getThemeColor, useMantineTheme } from "@mantine/core";
import {
  IconAlertOctagonFilled,
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconInfoSquareRoundedFilled,
  IconProps,
} from "@tabler/icons-react";

type Status = "positive" | "negative" | "warning" | "info";

type StatusIconProps = {
  status: Status;
} & IconProps;

const iconsMap: Record<Status, FC<IconProps>> = {
  positive: IconCircleCheckFilled,
  negative: IconAlertOctagonFilled,
  warning: IconAlertTriangleFilled,
  info: IconInfoSquareRoundedFilled,
};

const statusColorMap: Record<Status, string> = {
  positive: "green",
  negative: "red",
  warning: "orange",
  info: "violet",
};

export const StatusIcon: FC<StatusIconProps> = ({ status, ...props }) => {
  const theme = useMantineTheme();
  const color = getThemeColor(statusColorMap[status], theme);
  const Icon = iconsMap[status];
  return <Icon color={color} {...props} />;
};
