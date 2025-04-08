import { ComponentPropsWithoutRef, FC, ReactNode, useMemo } from "react";
import { Badge, Button, Group, Paper, Text } from "@mantine/core";

export type ActionBarConfig = ComponentPropsWithoutRef<"div"> & {
  cancelSelectionText?: ReactNode;
  itemsSelectedText?: ReactNode;
  selectAllText?: ReactNode;
};

type ActionBarProps = ActionBarConfig & {
  selectedItemCount: number;
  onSelectAllItems: (() => void) | undefined;
  onCancelSelection: () => void;
  itemSingleText: string;
  itemPluralText: string;
};

export const ActionBar: FC<ActionBarProps> = ({
  cancelSelectionText = "Cancel",
  itemsSelectedText,
  selectAllText = "Select all",
  children,
  selectedItemCount,
  onSelectAllItems,
  onCancelSelection,
  itemSingleText,
  itemPluralText,
  ...props
}) => {
  const selectedDisplayText = useMemo(() => {
    if (itemsSelectedText) return itemsSelectedText;

    return selectedItemCount === 1
      ? `${itemSingleText} selected`
      : `${itemPluralText} selected`;
  }, [selectedItemCount, itemsSelectedText, itemSingleText, itemPluralText]);

  return (
    <Paper withBorder p="xs" radius="md" shadow="xs">
      <Group justify="space-between" {...props}>
        <Group gap="xs">
          <Badge size="lg" radius="md">
            {selectedItemCount}
          </Badge>
          <Text span>{selectedDisplayText}</Text>
          {onSelectAllItems ? (
            <Button onClick={onSelectAllItems} variant="subtle">
              {selectAllText}
            </Button>
          ) : null}
        </Group>
        <Group gap="xs">
          <Button onClick={onCancelSelection} variant="subtle">
            {cancelSelectionText}
          </Button>
          {children}
        </Group>
      </Group>
    </Paper>
  );
};
