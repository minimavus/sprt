import { Text } from "@mantine/core";
import type { FC } from "react";

import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useCleanupScheduledJobs } from "@/hooks/cleanups/processes";

const CleanupScheduled: FC = () => {
  const { data, error, status } = useCleanupScheduledJobs();

  return (
    <>
      <ColumnHeading mb="xs">Scheduled jobs</ColumnHeading>
      {status === "pending" ? (
        <DefaultLoaderFallback />
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : (
        <Text>
          {data?.length ? JSON.stringify(data, null, 2) : "No scheduled jobs"}
        </Text>
      )}
    </>
  );
};

export { CleanupScheduled };
