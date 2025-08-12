import {
  Box,
  getThemeColor,
  Stack,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconAlertOctagonFilled,
  IconInfoSquareRoundedFilled,
} from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { Background } from "./Background";
import type { Variant } from "./types";

type EmptyStateProps = {
  title?: string;
  message?: ReactNode;
  variant?: Variant;
};

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  message,
  variant = "info",
}) => {
  const theme = useMantineTheme();
  const color = getThemeColor(variant === "negative" ? "red" : "violet", theme);

  return (
    <Stack
      align="center"
      pos="relative"
      justify="center"
      style={{ zIndex: 0 }}
      gap="xs"
    >
      <Background variant={variant} />
      {variant === "negative" ? (
        <IconAlertOctagonFilled size="50%" color={color} />
      ) : (
        <IconInfoSquareRoundedFilled size="50%" color={color} />
      )}
      {title ? (
        <Box ta="center">
          <Title order={4}>{title}</Title>
        </Box>
      ) : null}
      {message ? <Box ta="center">{message}</Box> : null}
    </Stack>
  );
};
