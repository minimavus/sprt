import { FC } from "react";
import { Box, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowForwardUp } from "@tabler/icons-react";
import cx from "classnames";

import { styles as cardStyles } from "@/components/CardGrid";
import { EmptySessions } from "@/components/Empty/EmptySessions";
import { useFixedLink } from "@/components/Link/useFixedLink";
import { ServerWithSessions } from "@/hooks/sessions/schemas";
import { Protos } from "@/hooks/zodProto";

import styles from "./Sessions.module.scss";
import type { ResolvedServersData } from "./types";

const ServerCard: FC<{ server: ServerWithSessions; proto: Protos }> = ({
  server,
  proto,
}) => {
  const sessions = server.bulks?.reduce((acc, b) => acc + b.sessions, 0);
  return (
    <Card withBorder className={cx(cardStyles.card, cardStyles.interactive)}>
      <Stack gap={0}>
        <Title order={3}>{server.server}</Title>
        <Text>
          {sessions} session{sessions !== 1 ? "s" : ""}
        </Text>
        <Card.Section py="sm" inheritPadding>
          <Group justify="end">
            <Button
              size="compact-sm"
              leftSection={<IconArrowForwardUp size={16} />}
              component="a"
              {...useFixedLink(`/sessions/${proto}/${server.server}`)}
              style={{ textDecoration: "none" }}
            >
              Open
            </Button>
          </Group>
        </Card.Section>
      </Stack>
    </Card>
  );
};

export const ServersGrid: FC<{
  servers: ResolvedServersData;
  proto: Protos;
}> = ({ servers, proto }) => {
  if (!servers) {
    return <EmptySessions proto="radius" />;
  }

  return (
    <Box component="div" p="xs" className={cx(styles["servers_grid"])}>
      {servers.map((server) => (
        <ServerCard key={server.server} server={server} proto={proto} />
      ))}
    </Box>
  );
};
