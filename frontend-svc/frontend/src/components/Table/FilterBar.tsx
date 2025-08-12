import { Group, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { FC, PropsWithChildren } from "react";

type FilterBarProps = PropsWithChildren<{
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  keyFilterChildren?: React.ReactNode;
  placeholder?: string;
}>;

export const FilterBar: FC<FilterBarProps> = ({
  globalFilter,
  setGlobalFilter,
  children,
  keyFilterChildren,
  placeholder = "Search",
}) => {
  return (
    <Group gap="sm" justify="space-between">
      <Group gap="sm">
        <TextInput
          placeholder={placeholder}
          leftSection={<IconSearch size={16} />}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.currentTarget.value)}
        />
        {keyFilterChildren}
      </Group>
      {children}
    </Group>
  );
};
