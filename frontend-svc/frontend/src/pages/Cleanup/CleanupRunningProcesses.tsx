import { FC } from "react";
import { Text } from "@mantine/core";

import { ColumnHeading } from "@/components/Columns";

const CleanupRunningProcesses: FC = () => {
  return (
    <>
      <ColumnHeading mb="xs">Running processes</ColumnHeading>
      <Text>Hey!!!</Text>
    </>
  );
};

export { CleanupRunningProcesses };
