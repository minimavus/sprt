import { FC, Suspense } from "react";
import { Stack } from "@mantine/core";
import {
  Await,
  LoaderFunctionArgs,
  Outlet,
  useLoaderData,
} from "react-router-dom";

import { AwaitError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";

// import { useQueryUser } from "@/hooks/useQueryUser";

const GlobalSettingsView: FC = () => {
  return (
    <Stack gap="sm" p="md">
      Hey!
    </Stack>
  );
};

const GlobalSettings: FC = () => {
  // const [user] = useQueryUser();
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
  // const user = new URL(request.url).searchParams.get("user");
  const resolved = Promise.resolve(["something"]);

  return resolved;
};
