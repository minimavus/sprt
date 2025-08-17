import { Text } from "@mantine/core";
import type { FC } from "react";

import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useCleanupJobs } from "@/hooks/cleanups/processes";

const CleanupRunningProcesses: FC = () => {
  const { data, error, status } = useCleanupJobs();

  return (
    <>
      <ColumnHeading mb="xs">Running jobs</ColumnHeading>
      {status === "pending" ? (
        <DefaultLoaderFallback />
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : (
        <Text>
          {data?.length ? JSON.stringify(data, null, 2) : "No running jobs"}
        </Text>
      )}
    </>
  );
};

export { CleanupRunningProcesses };
