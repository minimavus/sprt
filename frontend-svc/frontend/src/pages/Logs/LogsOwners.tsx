import { FC, useRef } from "react";
import { observer } from "@legendapp/state/react";
import {
  ActionIcon,
  Flex,
  getThemeColor,
  Menu,
  Space,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { IconAdjustments, IconCheck, IconFilter } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useParams } from "react-router-dom";

import { LinkButton } from "@/components/Link";

import { logOwnersStore$ } from "./store";

export const LogsOwners: FC = observer(() => {
  const { owner } = useParams<{ owner: string }>();
  const parentRef = useRef<HTMLDivElement>(null);

  const count = logOwnersStore$.filtered.get().length;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25,
  });

  const items = virtualizer.getVirtualItems();
  const theme = useMantineTheme();

  return (
    <>
      <TextInput
        placeholder="Filter"
        leftSection={<IconFilter size={14} />}
        leftSectionPointerEvents="none"
        value={logOwnersStore$.filter.get()}
        onChange={(e) => logOwnersStore$.filter.set(e.target.value)}
        rightSection={
          <Menu>
            <Menu.Target>
              <ActionIcon variant="light" aria-label="Select users type">
                <IconAdjustments size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => {
                  logOwnersStore$.toggleType("general");
                }}
                rightSection={
                  logOwnersStore$.hasType("general") ? (
                    <IconCheck
                      size={14}
                      color={getThemeColor("green", theme)}
                    />
                  ) : (
                    <Space w="14" />
                  )
                }
              >
                Users
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  logOwnersStore$.toggleType("system");
                }}
                rightSection={
                  logOwnersStore$.hasType("system") ? (
                    <IconCheck
                      size={14}
                      color={getThemeColor("green", theme)}
                    />
                  ) : (
                    <Space w="14" />
                  )
                }
              >
                System
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        }
      />
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
                <LinkButton
                  to={`/logs/${logOwnersStore$.filtered[virtualRow.index].owner.get()}`}
                  variant={
                    logOwnersStore$.filtered[virtualRow.index].owner.get() ===
                    owner
                      ? "light"
                      : undefined
                  }
                >
                  {logOwnersStore$.filtered[virtualRow.index].owner.get()}
                </LinkButton>
              </div>
            ))}
          </div>
        </div>
      </Flex>
    </>
  );
});
