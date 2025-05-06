import { FC, Suspense } from "react";
import { Stack } from "@mantine/core";
import { DefaultError } from "@tanstack/react-query";
import {
  Await,
  LoaderFunctionArgs,
  Outlet,
  useLoaderData,
} from "react-router-dom";

import { AwaitError, DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { GlobalConfig } from "@/hooks/config/schemas";
import {
  getUseConfigKeyAndEnsureDefaults,
  useConfig,
} from "@/hooks/config/useConfig";
import { queryClient } from "@/hooks/queryClient";

const GlobalSettingsView: FC = () => {
  const { data, error } = useConfig();
  return (
    <Stack gap="sm" p="md">
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {error ? <DisplayError error={error} /> : null}
    </Stack>
  );
};

const GlobalSettings: FC = () => {
  const data = useLoaderData<typeof globalSettingsLoader>();

  return (
    <>
      <PageLayout title="Global Settings" suspense fullHeight={false}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await resolve={data} errorElement={<AwaitError before={null} />}>
            {() => <GlobalSettingsView />}
          </Await>
        </Suspense>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { GlobalSettings };

export const globalSettingsLoader = async ({
  request: _,
}: LoaderFunctionArgs) => {
  const globalConfigKey = getUseConfigKeyAndEnsureDefaults();

  return {
    cfg: queryClient.ensureQueryData<unknown, DefaultError, GlobalConfig>({
      queryKey: globalConfigKey,
    }),
  };
};
