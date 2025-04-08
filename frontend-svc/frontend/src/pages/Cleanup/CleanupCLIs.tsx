import { FC } from "react";
import { Button, Skeleton, Text, useMantineTheme } from "@mantine/core";

import { Info } from "@/components/Alerts";
import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { useOrphanClisDelete, useOrphanedClis } from "@/hooks/cleanups";

const CleanupCLIs: FC = () => {
  const { data, status, error } = useOrphanedClis();
  const { mutateAsync, status: deleteStatus } = useOrphanClisDelete();

  const theme = useMantineTheme();
  return (
    <>
      <ColumnHeading mb="xs">Orphaned CLIs</ColumnHeading>
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
              orphaned CLIs
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
          <Info>No orphaned CLIs found!</Info>
        )
      ) : (
        <Text>No data</Text>
      )}
    </>
  );
};

export { CleanupCLIs };
