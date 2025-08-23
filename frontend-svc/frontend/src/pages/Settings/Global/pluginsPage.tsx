import { Group, rem, Stack } from "@mantine/core";
import type { DefaultError } from "@tanstack/react-query";
import { type FC, Suspense } from "react";
import { Await, Outlet, useLoaderData } from "react-router-dom";

import { AwaitError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import type { Plugins } from "@/hooks/config/schemas";
import { getUsePluginsKeyAndEnsureDefaults } from "@/hooks/config/usePlugins";
import { queryClient } from "@/hooks/queryClient";
import { PluginsView } from "./PluginsView";

const PluginsPage: FC = () => {
  const data = useLoaderData<typeof pluginsLoader>();

  return (
    <>
      <PageLayout title="Plugins" suspense fullHeight={false}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await
            resolve={data.cfg}
            errorElement={<AwaitError before={null} />}
            children={
              <Group pos="relative" align="normal" gap="0" flex={1}>
                <Stack gap="sm" p="md" flex={1} miw={rem(570)}>
                  <PluginsView />
                </Stack>
              </Group>
            }
          />
        </Suspense>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { PluginsPage };

export const pluginsLoader = async () => {
  const pluginsKey = getUsePluginsKeyAndEnsureDefaults();

  return {
    cfg: queryClient.ensureQueryData<unknown, DefaultError, Plugins>({
      queryKey: pluginsKey,
    }),
  };
};
