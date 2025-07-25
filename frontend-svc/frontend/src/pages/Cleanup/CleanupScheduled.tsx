import { Text } from "@mantine/core";
import type { FC } from "react";

import { ColumnHeading } from "@/components/Columns";

const CleanupScheduled: FC = () => {
  return (
    <>
      <ColumnHeading mb="xs">Scheduled</ColumnHeading>
      <Text>Hey!!!</Text>
    </>
  );
};

export { CleanupScheduled };
