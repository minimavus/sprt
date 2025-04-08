import { type FC } from "react";
import {
  ActionIcon,
  Group,
  HoverCard,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
  VisuallyHidden,
} from "@mantine/core";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { ok } from "neverthrow";

import { DisplayError } from "@/components/Error";
import { Link } from "@/components/Link";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { FormatTime } from "@/components/Time";
import { LogChunk, useLogChunk, useLogsDelete } from "@/hooks/logs";

import { LogLine } from "./LogsStream";

const SubOwnerColor = {
  api: "accent1",
  generator: "accent3",
  watcher: "accent2",
  udp_server: "accent4",
  default: "gray",
} satisfies Record<string, string | undefined>;

const PreviewPopover: FC<{ owner: string; chunk: string }> = ({
  owner,
  chunk,
}) => {
  const { data, error, status } = useLogChunk(owner, chunk, true);
  const theme = useMantineTheme();

  if (status === "pending")
    return (
      <Stack gap="xs" m="xs">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} height={theme.spacing.sm} radius="xl" />
        ))}
      </Stack>
    );

  if (status === "error") return <DisplayError error={error} />;

  if (!data) return <Text>No logs found</Text>;

  return (
    <div className="logs-stream-preview-limiter">
      <pre className="logs-stream">
        {data.logs.map((l) => (
          <LogLine key={l.timestamp} l={l} />
        ))}
      </pre>
    </div>
  );
};

const LogOwnerTag: FC<{ owner: string }> = ({ owner }) => {
  if (!owner.includes("__")) return null;

  const parts = owner.split("__").slice(1);

  const mapped = parts.map((o) => (
    <Text
      key={o}
      size="sm"
      c={
        SubOwnerColor[o as keyof typeof SubOwnerColor] || SubOwnerColor.default
      }
    >
      {o}
    </Text>
  ));

  return mapped.length > 0
    ? mapped.concat(
        <Text size="sm" c="gray" ml="3" mr="3" key="slash">
          /
        </Text>,
      )
    : null;
};

export const LogChunkItem: FC<{ owner: string; item: LogChunk }> = ({
  owner,
  item,
}) => {
  const { mutateAsync } = useLogsDelete(owner, item.chunk);
  const confirm = useDynamicConfirmation();

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="0">
        <Link to={`/logs/${owner}/${item.chunk}`}>{item.chunk}</Link>
        <Text size="sm" c="gray" ml="3" mr="3">
          /
        </Text>
        <LogOwnerTag owner={item.owner} />
        <HoverCard
          position="right"
          withArrow
          shadow="sm"
          width={500}
          openDelay={200}
        >
          <HoverCard.Target>
            <Text size="xs" c="gray" span>
              {item.count} msg{item.count > 1 ? "s" : ""}
            </Text>
          </HoverCard.Target>
          <HoverCard.Dropdown p="xs" className="logs-preview-popover">
            <PreviewPopover owner={owner} chunk={item.chunk} />
          </HoverCard.Dropdown>
        </HoverCard>
      </Group>
      <Group gap="xs">
        <div>
          <FormatTime t={item.started} showMillis />
        </div>
        <ActionIcon.Group>
          <Tooltip label="Download">
            <ActionIcon variant="subtle">
              <IconDownload size={18} />
              <VisuallyHidden>Download</VisuallyHidden>
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              onClick={() => {
                confirm({
                  children: (
                    <Text>
                      Are you sure you want to delete logs chunk{" "}
                      <Text fw="bold" span>
                        {item.chunk}
                      </Text>
                      {" of "}
                      <Text fw="bold" span>
                        {owner}?
                      </Text>
                    </Text>
                  ),
                  onConfirm: async () => {
                    await mutateAsync();
                    return ok(undefined);
                  },
                  confirmText: "Delete",
                  destructive: true,
                });
              }}
              variant="subtle"
            >
              <IconTrash size={18} />
              <VisuallyHidden>Delete</VisuallyHidden>
            </ActionIcon>
          </Tooltip>
        </ActionIcon.Group>
      </Group>
    </Group>
  );
};
