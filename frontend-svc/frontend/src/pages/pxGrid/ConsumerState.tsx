import { FC } from "react";
import { MantineColor, Text } from "@mantine/core";

import type { PxGridConnection } from "@/hooks/pxgrid/schemas";

const stateClassMap: Record<PxGridConnection["state"], MantineColor> = {
  ENABLED: "blue",
  DISABLED: "red",
  PENDING: "gray",
  UNKNOWN: "orange",
};

export const ConsumerState: FC<{ state: PxGridConnection["state"] }> = ({
  state,
}) => {
  return (
    <Text span c={stateClassMap[state]}>
      {state}
    </Text>
  );
};
