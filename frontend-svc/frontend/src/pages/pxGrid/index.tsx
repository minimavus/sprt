import { Suspense, type FC } from "react";
import {
  Box,
  Button,
  Collapse,
  Group,
  Loader,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { DefaultError } from "@tanstack/react-query";
import {
  Await,
  Outlet,
  useLoaderData,
  type LoaderFunction,
} from "react-router-dom";

import { Warning } from "@/components/Alerts";
import { CardGrid } from "@/components/CardGrid";
import { AwaitError, DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import {
  getPxGridConnectionsKeyAndEnsureDefaults,
  getPxGridStatusKeyAndEnsureDefaults,
  usePxGridConnections,
  usePxGridStatus,
} from "@/hooks/pxgrid";
import type { PxGridConnections, PxGridStatus } from "@/hooks/pxgrid/schemas";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";

import { ConsumerCard } from "./ConsumerCard";
import { NewConsumerCard } from "./NewConsumerCard";

const PxGridView: FC = () => {
  const [qu] = useQueryUser();
  const { data, status, error, isFetching, isLoading } =
    usePxGridConnections(qu);

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error") {
    return <DisplayError error={error} />;
  }

  return (
    <>
      <Group gap="xs">
        <Title order={3} mb="sm">
          Consumers
        </Title>
        {isFetching || isLoading ? (
          <Loader
            size={16}
            type="dots"
            style={{ alignSelf: "flex-start" }}
            color="gray"
          />
        ) : null}
      </Group>
      <CardGrid minCardWidth={rem(350)}>
        {data.connections.map((connection) => (
          <ConsumerCard key={connection.id} connection={connection} />
        ))}
        <NewConsumerCard />
      </CardGrid>
    </>
  );
};

const PxGridStatusView: FC<{ status: PxGridStatus }> = ({ status: init }) => {
  const { data } = usePxGridStatus();
  const status = data ?? init;
  const [opened, { toggle }] = useDisclosure(false);

  if (status.enabled && status.healthy) {
    return null;
  }

  return (
    <Stack flex={1}>
      <Warning>
        {status.enabled
          ? "pxGrid is enabled but unhealthy"
          : "pxGrid is disabled"}

        {status.error ? (
          <Box mt="xs">
            <Collapse in={opened}>
              <Text mb="xs">Error: {status.error}</Text>
            </Collapse>
            <Button
              variant="subtle"
              onClick={toggle}
              size="compact-xs"
              rightSection={
                <IconChevronDown
                  size={14}
                  style={{ transform: opened ? "rotate(-180deg)" : "none" }}
                />
              }
            >
              {opened ? "Hide" : "Show"} details
            </Button>
          </Box>
        ) : null}
      </Warning>
    </Stack>
  );
};

const PxAwaitError: FC = () => {
  const { data: st } = usePxGridStatus();
  if (st?.enabled && !st?.healthy) {
    return null;
  }

  return <AwaitError before={null} />;
};

type LoaderData = {
  status: PxGridStatus | Promise<PxGridStatus>;
  connections: PxGridConnections | Promise<PxGridConnections>;
};

const PxGridPage: FC = () => {
  const data = useLoaderData() as LoaderData;
  return (
    <>
      <PageLayout title="pxGrid" uncontained fullHeight={false}>
        <div
          style={{
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Suspense fallback={null}>
            <Await
              resolve={data.status}
              errorElement={<AwaitError before={null} />}
            >
              {(status) => <PxGridStatusView status={status} />}
            </Await>
          </Suspense>
          <Suspense fallback={<DefaultLoaderFallback />}>
            <Await resolve={data.connections} errorElement={<PxAwaitError />}>
              {() => <PxGridView />}
            </Await>
          </Suspense>
        </div>
      </PageLayout>
      <Outlet />
    </>
  );
};

export const pxGridLoader: LoaderFunction = async ({ request }) => {
  const user = new URL(request.url).searchParams.get("user");
  const statusQueryKey = getPxGridStatusKeyAndEnsureDefaults();
  const userConnectionsQueryKey =
    getPxGridConnectionsKeyAndEnsureDefaults(user);

  return {
    status: queryClient.ensureQueryData<unknown, DefaultError, PxGridStatus>({
      queryKey: statusQueryKey,
    }),
    connections: queryClient.ensureQueryData<
      unknown,
      DefaultError,
      PxGridConnections
    >({
      queryKey: userConnectionsQueryKey,
    }),
  };
};

export { PxGridPage as PxGrid };
