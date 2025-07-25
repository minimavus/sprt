import { Button, Skeleton, Text, useMantineTheme } from "@mantine/core";
import type { FC } from "react";

import { Info } from "@/components/Alerts";
import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { useOrphanedFlows, useOrphanFlowsDelete } from "@/hooks/cleanups";

const CleanupFlows: FC = () => {
  const { data, status, error } = useOrphanedFlows();
  const { mutateAsync, status: deleteStatus } = useOrphanFlowsDelete();
  const theme = useMantineTheme();

  return (
    <>
      <ColumnHeading mb="xs">Orphaned flows</ColumnHeading>
      {status === "pending" ? (
        Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} height={theme.spacing.md} radius="xl" mb="sm" />
        ))
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : data ? (
        data.total > 0 ? (
          <>
            <Text>
              Found{" "}
              <Text fw="bold" span>
                {data.total}
              </Text>{" "}
              orphaned flows
            </Text>
            <div>
              <Button
                loading={deleteStatus === "pending"}
                onClick={() => void mutateAsync()}
              >
                Clean up!
              </Button>
            </div>
          </>
        ) : (
          <Info>No orphaned flows found!</Info>
        )
      ) : (
        <Text>No data</Text>
      )}
    </>
  );
};

export { CleanupFlows };
