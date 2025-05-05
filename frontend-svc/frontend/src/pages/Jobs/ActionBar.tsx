import { useState, type FC } from "react";
import { observer } from "@legendapp/state/react";
import {
  Button,
  Group,
  Menu,
  SegmentedControl,
  SegmentedControlItem,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import { ok } from "neverthrow";

import { useDynamicConfirmation } from "@/components/Modals/Confirmation";

import { ArrangeBy, state$ } from "./store";

const arrangeSwitcherOptions: SegmentedControlItem[] = [
  { value: "none", label: "None" },
  { value: "date", label: "By date" },
  { value: "protocol", label: "By protocol" },
  { value: "server", label: "By server" },
] satisfies Array<{
  value: ArrangeBy;
  label: string;
}>;

export const ActionBar: FC = observer(function ActionBar() {
  const confirm = useDynamicConfirmation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Group justify="space-between">
      <Group gap="xs" justify="center">
        <Text size="sm">Group</Text>
        <SegmentedControl
          data={arrangeSwitcherOptions}
          value={state$.arrangeBy.get()}
          onChange={(v) => state$.arrangeBy.set(v as ArrangeBy)}
        />
      </Group>
      <div>
        <Menu
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
        >
          <Menu.Target>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              variant="outline"
              rightSection={
                <IconChevronDown
                  size={14}
                  style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
                />
              }
            >
              Delete
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              onClick={() => {
                confirm({
                  title: "Delete jobs",
                  children: "Are you sure you want to delete all jobs?",
                  onConfirm: async () => {
                    // TODO:
                    return ok(undefined);
                  },
                  confirmText: "Delete",
                  destructive: true,
                });
              }}
            >
              Delete all
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                confirm({
                  title: "Delete jobs",
                  children: (
                    <Text>
                      Are you sure you want to delete all{" "}
                      <Text span fw="bold">
                        successfully completed
                      </Text>
                      {" jobs?"}
                    </Text>
                  ),
                  onConfirm: async () => {
                    // TODO:
                    return ok(undefined);
                  },
                  confirmText: "Delete",
                  destructive: true,
                });
              }}
            >
              Delete successfully completed
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                confirm({
                  title: "Delete jobs",
                  children: (
                    <Text>
                      Are you sure you want to delete all{" "}
                      <Text span fw="bold">
                        failed
                      </Text>
                      {" jobs?"}
                    </Text>
                  ),
                  onConfirm: async () => {
                    // TODO:
                    return ok(undefined);
                  },
                  confirmText: "Delete",
                  destructive: true,
                });
              }}
            >
              Delete failed
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </Group>
  );
});
