import { FC, Suspense } from "react";
import { Button, Stack } from "@mantine/core";
import { DefaultError } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
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
import { useNADSourcesAll } from "@/hooks/generate/useNADSources";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";

const defaultValuesFromInit = (init: GlobalConfig["config"]) => {
  return Object.keys(init).reduce(
    (acc, key) => {
      acc[key] = init[key as keyof typeof init].value;
      return acc;
    },
    {} as Record<string, unknown>,
  );
};

const IPSourcesConfig: FC = () => {
  const [u] = useQueryUser();
  const { data, error, status } = useNADSourcesAll(u);

  if (status === "pending") return <>Loading IP sources</>;
  if (status === "error") {
    return <DisplayError error={error} before="Failed to load IP sources" />;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

const GlobalSettingsView: FC<{ data: GlobalConfig["config"] }> = ({
  data: init,
}) => {
  const { data, error } = useConfig();
  const form = useForm({
    defaultValues: defaultValuesFromInit(init),
  });

  const onSubmit = form.handleSubmit((values) => {
    console.log("Form submitted with values:", values);
  });

  return (
    <FormProvider {...form}>
      <Stack gap="sm" p="md" flex={1}>
        <IPSourcesConfig />
        <div>
          <Button type="submit" onClick={onSubmit}>
            Save
          </Button>
        </div>
      </Stack>
    </FormProvider>
  );
};

const GlobalSettings: FC = () => {
  const data = useLoaderData<typeof globalSettingsLoader>();

  return (
    <>
      <PageLayout title="Global Settings" suspense fullHeight={false}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await resolve={data.cfg} errorElement={<AwaitError before={null} />}>
            {(data) => <GlobalSettingsView data={data?.config} />}
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
