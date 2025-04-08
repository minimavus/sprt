import { type FC, type PropsWithChildren, type ReactNode } from "react";
import { Box, Flex, Paper, Stack, Title } from "@mantine/core";
import { useMatches } from "react-router-dom";

import { isWithTitle } from "./isWithTitle";
import { SuspenseWrapper } from "./SuspenseWrapper";

interface PageLayoutProps {
  title?: ReactNode | false;
  suspense?: boolean;
  subtitle?: ReactNode;
  uncontained?: boolean;
  fullHeight?: boolean;
}

const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  title,
  children,
  suspense = false,
  subtitle,
  uncontained,
  fullHeight = true,
}) => {
  const m = useMatches();
  if (!title && title !== false) {
    for (let i = m.length - 1; i > 0; i--) {
      const el = m[i];
      if (isWithTitle(el)) title = el.handle.title;
      break;
    }
  }

  return (
    <SuspenseWrapper enabled={suspense}>
      {title ? (
        <Box mb="md">
          <Title order={1}>{title}</Title>
          {subtitle ? (
            <Title size="xs" component="span">
              {subtitle}
            </Title>
          ) : null}
        </Box>
      ) : null}
      <Stack flex={1}>
        {uncontained ? (
          <Flex gap="sm" style={{ flex: fullHeight ? 1 : undefined }}>
            {children}
          </Flex>
        ) : (
          <Paper
            radius="md"
            withBorder
            flex={fullHeight ? 1 : undefined}
            display="flex"
          >
            {children}
          </Paper>
        )}
      </Stack>
    </SuspenseWrapper>
  );
};

export { PageLayout };
