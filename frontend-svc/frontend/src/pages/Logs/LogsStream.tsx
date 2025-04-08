import { FC, forwardRef, useRef } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import {
  ActionIcon,
  ActionIconProps,
  Anchor,
  Button,
  Divider,
  Flex,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Skeleton,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowBarToDown,
  IconArrowBarToUp,
  IconArrowLeftDashed,
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useVirtualizer, Virtualizer } from "@tanstack/react-virtual";
import { ok } from "neverthrow";
import { useNavigate, useParams } from "react-router-dom";

import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { FormatTime } from "@/components/Time";
import { LogItem, useLogChunk, useLogsDelete } from "@/hooks/logs";

const ControlPanel: FC = () => {
  const { owner, chunk } = useParams<{ owner: string; chunk: string }>();
  const navigate = useNavigate();
  const { mutateAsync } = useLogsDelete(owner!, chunk);
  const confirm = useDynamicConfirmation();

  return (
    <Group gap="xs">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeftDashed size={16} />}
        onClick={() => navigate(`/logs/${owner}`)}
      >
        Back to chunks
      </Button>
      <Button
        color="red"
        leftSection={<IconTrash size={16} />}
        onClick={() =>
          confirm({
            children: (
              <Text>
                Are you sure you want to delete logs chunk of{" "}
                <Text fw="bold" span>
                  {owner}?
                </Text>
              </Text>
            ),
            onConfirm: async () => {
              await mutateAsync().finally(() => {
                navigate(`/logs/${owner}`);
              });
              return ok(undefined);
            },
            confirmText: "Delete",
            destructive: true,
          })
        }
      >
        Delete chunk
      </Button>
    </Group>
  );
};

const jsonPrefixLength = "--jsondata=".length;

const JsonifyString: FC<{ s: string }> = ({ s }) => {
  const [opened, { open, close }] = useDisclosure(false);

  let parsed: object, cutOff: string;
  try {
    cutOff = s.slice(jsonPrefixLength + 1, -1);
    parsed = JSON.parse(cutOff);
  } catch (_e) {
    return s;
  }

  return (
    <>
      --
      <Anchor
        style={{ textIndent: 0, verticalAlign: "baseline" }}
        onClick={open}
        inherit
      >
        jsondata
      </Anchor>
      ='{cutOff}'
      <Modal.Root
        opened={opened}
        onClose={close}
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>JSON Data</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body pb="0">
            <CodeHighlight
              language="json"
              code={JSON.stringify(parsed, null, 2)}
            />
            <Group
              justify="end"
              gap="xs"
              style={{
                position: "sticky",
                bottom: 0,
                background: "var(--mantine-color-body)",
              }}
              p="md"
            >
              <Button onClick={close} variant="default">
                OK
              </Button>
            </Group>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};

const LevelClassName: Record<string, string> = {
  FATAL: "red",
  ERROR: "red",
  WARN: "orange",
  INFO: "violet",
  DEBUG: "dimmed",
  TRACE: "dimmed",
};

const LogLine = forwardRef<HTMLParagraphElement, { l: LogItem }>(
  ({ l, ...props }, ref) => {
    return (
      <Text size="xs" className="log-line" ref={ref} {...props}>
        <Text c="dimmed" inherit span>
          <FormatTime t={l.timestamp} showMillis />
        </Text>
        :{" "}
        <Text span c={LevelClassName[l.loglevel]}>
          {l.loglevel}
        </Text>
        :{" "}
        {l.message?.startsWith("--jsondata") ? (
          <JsonifyString s={l.message} />
        ) : (
          l.message
        )}
      </Text>
    );
  },
);

const actionProps: ActionIconProps = {
  variant: "subtle",
  color: "gray",
  size: 30,
};

const SearchPanel: FC<{
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  items: LogItem[];
}> = ({ virtualizer }) => {
  return (
    <div className="search-panel">
      <Paper shadow="xs">
        <Group gap="xs">
          <TextInput
            placeholder="Search..."
            size="xs"
            leftSection={<IconSearch size={14} />}
          />
          <ActionIcon.Group>
            <Tooltip label="Previous">
              <ActionIcon {...actionProps}>
                <IconArrowNarrowUp size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Next">
              <ActionIcon {...actionProps}>
                <IconArrowNarrowDown size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Divider orientation="vertical" size="xs" />
            <Tooltip label="Scroll to top">
              <ActionIcon
                onClick={() => virtualizer.scrollToIndex(0)}
                {...actionProps}
              >
                <IconArrowBarToUp size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Scroll to bottom">
              <ActionIcon
                onClick={() =>
                  virtualizer.scrollToIndex(virtualizer.options.count, {
                    behavior: "auto",
                    align: "end",
                  })
                }
                {...actionProps}
              >
                <IconArrowBarToDown size={16} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
        </Group>
      </Paper>
    </div>
  );
};

const LogsStream: FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { owner, chunk } = useParams<{ owner: string; chunk: string }>();

  const { data, error, status } = useLogChunk(owner!, chunk!);

  const count = data?.logs.length || 0;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25,
  });

  const items = virtualizer.getVirtualItems();
  const theme = useMantineTheme();

  return (
    <>
      <ColumnHeading>Logs</ColumnHeading>
      <ControlPanel />
      {status === "pending" ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            height={theme.spacing.md}
            radius="xl"
            mb="sm"
            width={i === 5 ? "75%" : "100%"}
          />
        ))
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : data?.logs?.length > 0 ? (
        <Flex
          flex={1}
          direction="column"
          className="virtual-list__wrapper"
          ref={parentRef}
          style={{ position: "relative" }}
        >
          <SearchPanel virtualizer={virtualizer} items={data.logs} />
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            <pre
              className="logs-stream"
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                transform: `translateY(${items[0]?.start ?? 0}px)`,
              }}
            >
              {items.map((virtualRow) => (
                <LogLine
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  l={data.logs[virtualRow.index]}
                />
              ))}
            </pre>
          </div>
        </Flex>
      ) : (
        <Text>No logs found</Text>
      )}
    </>
  );
};

export { LogsStream, LogLine };
