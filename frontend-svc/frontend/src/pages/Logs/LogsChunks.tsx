import { useRef, type FC } from "react";
import {
  Button,
  Flex,
  Group,
  Skeleton,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ok } from "neverthrow";
import { useNavigate, useParams } from "react-router-dom";

import { Info } from "@/components/Alerts";
import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { useLogOwnerChunks, useLogsDelete } from "@/hooks/logs";

import { LogChunkItem } from "./LogChunkItem";

const ControlPanel: FC = () => {
  const { owner } = useParams<{ owner: string }>();
  const { mutateAsync } = useLogsDelete(owner!);
  const navigate = useNavigate();
  const confirm = useDynamicConfirmation();

  return (
    <Group>
      <Button
        color="red"
        leftSection={<IconTrash size={16} />}
        onClick={() =>
          confirm({
            children: (
              <Text>
                Are you sure you want to delete all logs of{" "}
                <Text fw="bold" span>
                  {owner}?
                </Text>
              </Text>
            ),
            onConfirm: async () => {
              await mutateAsync().finally(() => {
                navigate(`/logs`);
              });
              return ok(undefined);
            },
            confirmText: "Delete",
            destructive: true,
          })
        }
      >
        Delete all
      </Button>
    </Group>
  );
};

const LogsChunks: FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { owner } = useParams<{ owner: string }>();
  const { data, error, status } = useLogOwnerChunks(owner!);
  const theme = useMantineTheme();

  const count = data?.chunks?.length || 0;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <>
      <ColumnHeading>Chunks ({owner})</ColumnHeading>
      {status === "pending" ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            height={theme.spacing.lg}
            radius="xl"
            mb="sm"
            width={i === 5 ? "75%" : "100%"}
          />
        ))
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : data ? (
        <>
          <ControlPanel />
          <Flex
            flex={1}
            direction="column"
            className="virtual-list__wrapper"
            ref={parentRef}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  transform: `translateY(${items[0]?.start ?? 0}px)`,
                }}
                className="virtual-list"
              >
                {items.map((virtualRow) => (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={
                      virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"
                    }
                  >
                    <LogChunkItem
                      owner={data.logs_owner}
                      item={data.chunks[virtualRow.index]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Flex>
        </>
      ) : (
        <Info>No logs found</Info>
      )}
    </>
  );
};

export { LogsChunks };
