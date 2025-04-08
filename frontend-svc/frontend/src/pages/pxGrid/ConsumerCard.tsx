import { FC, ReactNode } from "react";
import {
  Button,
  Card,
  Divider,
  Group,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowForwardUp,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import cx from "classnames";

import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { styles } from "@/components/CardGrid";
import { KeyValue } from "@/components/KeyValue";
import { useFixedLink } from "@/components/Link/useFixedLink";
import {
  usePxGridConnectionDelete,
  usePxGridConnectionStateRefresh,
} from "@/hooks/pxgrid";
import type { PxGridConnection } from "@/hooks/pxgrid/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";

import { ConsumerState } from "./ConsumerState";
import { WebSocketsState } from "./WebSocketsState";

export const ConsumerCard: FC<{ connection: PxGridConnection }> = ({
  connection,
}) => {
  const [user] = useQueryUser();
  const { mutate: deleteConnection, isPending: isDeleting } =
    usePxGridConnectionDelete(user);
  const { mutate: refreshConnection, isPending: isRefreshing } =
    usePxGridConnectionStateRefresh(user);

  const pairs: [string, ReactNode][] = [
    ["State", <ConsumerState state={connection.state} />],
    ["WebSockets", <WebSocketsState connection={connection} />],
  ];

  return (
    <div>
      <Card className={cx(styles.card, styles.interactive)} withBorder>
        <Stack gap="sm">
          <div>
            <Title
              order={5}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {connection.friendly_name}
            </Title>
            <Text size="xs" c="dimmed">
              {connection.client_name}
            </Text>
          </div>
          <KeyValue pairs={pairs} justifyKeys="start" kw={100} gap={rem(4)} />
          <Card.Section inheritPadding py="sm" withBorder>
            <Group gap="xs" justify="flex-end">
              <Button
                size="compact-sm"
                leftSection={<IconArrowForwardUp size={16} />}
                component="a"
                {...useFixedLink(`/pxgrid/${connection.id}`)}
                style={{ textDecoration: "none" }}
                className={isDeleting || isRefreshing ? "disabled" : ""}
              >
                Open
              </Button>
              <Button
                size="compact-sm"
                variant="subtle"
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  refreshConnection({ id: connection.id });
                }}
                loading={isRefreshing}
                className={isDeleting ? "disabled" : ""}
              >
                Refresh state
              </Button>
              <Divider orientation="vertical" />
              <ButtonWithConfirm
                size="compact-sm"
                destructive
                leftSection={<IconTrash size={16} />}
                confirmText="Delete"
                onConfirm={async () => {
                  deleteConnection({ id: connection.id });
                }}
                confirmBody={
                  <Text>
                    Are you sure you want to delete pxGrid connection{" "}
                    <Text span fw="bold">
                      {connection.friendly_name || connection.id}?
                    </Text>
                  </Text>
                }
                loading={isDeleting}
                disabled={isRefreshing}
                variant="subtle"
              >
                Delete
              </ButtonWithConfirm>
            </Group>
          </Card.Section>
        </Stack>
      </Card>
    </div>
  );
};
