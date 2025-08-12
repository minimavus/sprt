import { Group } from "@mantine/core";
import type { FC } from "react";

import { EmptyState } from "@/components/EmptyState";
import type { Protos } from "@/hooks/zodProto";

type EmptyProps = { proto: Protos };

export const EmptySessions: FC<EmptyProps> = () => {
  return (
    <Group justify="center" flex={1} p="xl">
      <EmptyState title="No sessions found" />
    </Group>
  );
};
