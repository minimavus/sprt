import { useState, type FC, type ReactNode } from "react";
import {
  Anchor,
  Divider,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";

import { Info } from "@/components/Alerts";
import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { ColumnHeading } from "@/components/Columns";
import { DisplayError } from "@/components/Error";
import { useFixedLink } from "@/components/Link/useFixedLink";
import {
  useOldSessions,
  useOldSessionsDelete,
  type OldSessions,
} from "@/hooks/cleanups";
import type { Protos } from "@/hooks/zodProto";

import styles from "./Sessions.module.scss";

const LinkToOwnerSessions: FC<{ owner: string; proto: Protos }> = ({
  owner,
  proto,
}) => {
  return (
    <Anchor {...useFixedLink(`/sessions/${proto}?user=${owner}`)}>
      {owner}
    </Anchor>
  );
};

const DisplayOldSessions: FC<{
  data: OldSessions;
  proto: Protos;
}> = ({ data, proto }) => {
  const { mutateAsync, isPending } = useOldSessionsDelete();
  if (
    !data[proto]?.["30"].length &&
    !data[proto]?.["10"].length &&
    !data[proto]?.["5"].length
  )
    return <Info>No outdated sessions!</Info>;

  const columns: ReactNode[] = [];

  for (const days of [30, 10, 5] as const) {
    const items = data[proto]?.[`${days}`];
    if (!items || items.length === 0) continue;

    columns.push(
      <Stack gap="sm" key={days} className={styles.column}>
        <Title order={5}>{days} days</Title>
        <ul className={styles.list_of_sessions}>
          {items.map((item) => (
            <li key={item.owner}>
              <Text>
                <LinkToOwnerSessions owner={item.owner} proto={proto} />:{" "}
                {item.count}
              </Text>
            </li>
          ))}
        </ul>
        <ButtonWithConfirm
          destructive
          confirmText="Delete"
          onConfirm={async () => {
            await mutateAsync({ proto, older_than_days: days });
          }}
          confirmBody="Are you sure you want to delete these sessions?"
          loading={isPending}
        >
          Delete
        </ButtonWithConfirm>
      </Stack>,
    );
  }

  return <div className={styles.grid}>{columns}</div>;
};

const CleanupSessions: FC = () => {
  const { data, error, status } = useOldSessions();
  const [proto, setProto] = useState<Protos>("radius");
  const theme = useMantineTheme();

  return (
    <>
      <ColumnHeading mb="xs">Outdated sessions</ColumnHeading>
      {status === "pending" ? (
        Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} height={theme.spacing.md} radius="xl" mb="sm" />
        ))
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : data ? (
        <>
          <SegmentedControl
            onChange={(value) => setProto(value as any)}
            data={[
              {
                label: "RADIUS",
                value: "radius",
              },
              {
                label: "TACACS+",
                value: "tacacs",
              },
            ]}
            value={proto}
          />
          <Divider size="xs" mt="sm" mb="sm" />
          <DisplayOldSessions data={data} proto={proto} />
        </>
      ) : (
        <Text>No data</Text>
      )}
    </>
  );
};

export { CleanupSessions };
