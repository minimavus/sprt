import { FC, Suspense, useEffect } from "react";
import { Group, Stack, Tabs } from "@mantine/core";
import { DefaultError } from "@tanstack/react-query";
import {
  Await,
  LoaderFunction,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { ColumnHeading } from "@/components/Columns";
import { EmptySessions } from "@/components/Empty/EmptySessions";
import { AwaitError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { queryClient } from "@/hooks/queryClient";
import { getSessionsSummaryKeyAndEnsureDefaults } from "@/hooks/sessions";
import { SessionsSummary } from "@/hooks/sessions/schemas";

import { BulkTabLink } from "../BulkTabLink";
import { ServersGrid } from "../ServersGrid";
import type { LoaderData, ResolvedData, ResolvedServerData } from "../types";

const RadiusBulks: FC<{ server: ResolvedServerData }> = ({ server }) => {
  const { bulk } = useParams<{ bulk: string }>();

  const nav = useNavigate();
  const l = useLocation();
  useEffect(() => {
    if (bulk) {
      return;
    }
    if (server && Array.isArray(server.bulks) && server.bulks.length) {
      nav(`${server.bulks[0].name}${l.search}`, { relative: "path" });
    }
  }, [bulk]);

  if (!server || !Array.isArray(server.bulks) || !server.bulks.length) {
    return <EmptySessions proto="radius" />;
  }

  return (
    <Group gap="sm" align="start" wrap="nowrap" p="md" miw={0} flex={1}>
      <Stack gap="sm">
        <ColumnHeading>Bulks</ColumnHeading>
        <Tabs orientation="vertical" value={bulk}>
          <Tabs.List flex={1}>
            {server.bulks.map((blk) => (
              <BulkTabLink
                key={blk.name}
                server={server.server}
                bulk={blk}
                proto="radius"
              />
            ))}
          </Tabs.List>
        </Tabs>
      </Stack>
      <Stack gap="sm" miw={0} flex={1}>
        <Outlet />
      </Stack>
    </Group>
  );
};

const Page: FC = () => {
  const data = useLoaderData() as LoaderData;

  return (
    <PageLayout title="RADIUS Sessions" fullHeight={false}>
      <Suspense fallback={<DefaultLoaderFallback />}>
        <Await
          resolve={data.server}
          errorElement={<AwaitError before={null} />}
        >
          {(server: ResolvedData) =>
            Array.isArray(server) ? (
              <ServersGrid servers={server} proto="radius" />
            ) : (
              <RadiusBulks server={server} />
            )
          }
        </Await>
      </Suspense>
    </PageLayout>
  );
};

export const radiusSessionsLoader: LoaderFunction = async ({
  params,
  request,
}) => {
  const user = new URL(request.url).searchParams.get("user");
  const queryKey = getSessionsSummaryKeyAndEnsureDefaults(user);
  return {
    server: queryClient
      .ensureQueryData<unknown, DefaultError, SessionsSummary>({
        queryKey,
      })
      .then((data) => {
        if (params.server) {
          return data.radius?.find((s) => s.server === params.server) ?? null;
        }
        return data.radius || null;
      }),
  };
};

export { Page as RadiusSessionsPage };
