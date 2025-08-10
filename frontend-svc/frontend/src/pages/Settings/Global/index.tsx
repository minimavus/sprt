import {
  Button,
  Fieldset,
  Group,
  NumberInput,
  rem,
  Stack,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useElementSize, useMergedRef } from "@mantine/hooks";
import { IconDeviceFloppy } from "@tabler/icons-react";
import type { DefaultError } from "@tanstack/react-query";
import { type FC, Suspense, useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  useController,
  useForm,
} from "react-hook-form";
import { Await, Outlet, useAsyncValue, useLoaderData } from "react-router-dom";

import { AwaitError } from "@/components/Error";
import {
  InputSideButtons,
  InputSideButtonsContext,
} from "@/components/Inputs/InputSideButtons";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import type { GlobalConfig } from "@/hooks/config/schemas";
import {
  getUseConfigKeyAndEnsureDefaults,
  useConfig,
} from "@/hooks/config/useConfig";
import { queryClient } from "@/hooks/queryClient";
import { flattenObject } from "@/utils/flattenObject";
import set from "@/utils/set";
import { funcButtons } from "./funcButtons";
import { IPSourcesConfig } from "./IPSourcesConfig";
import { PluginsView } from "./PluginsView";

const defaultValuesFromInit = (init: GlobalConfig["config"]) => {
  return Object.keys(init).reduce(
    (acc, key) => {
      return set(key, init[key as keyof typeof init].value, acc);
    },
    {} as Record<string, unknown>,
  );
};

const JobsConfig: FC = () => {
  const { data: cfg } = useConfig();

  return (
    <Fieldset legend="Jobs">
      <Stack gap="sm">
        <Controller
          name="generator.jobs.max-conc"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.jobs.max-conc"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="generator.jobs.max-threads"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.jobs.max-threads"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="generator.jobs.max-sessions-per-job"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.jobs.max-sessions-per-job"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
      </Stack>
    </Fieldset>
  );
};

const RadiusConfig: FC = () => {
  const { data: cfg } = useConfig();

  return (
    <Fieldset legend="RADIUS">
      <Stack gap="sm">
        <Controller
          name="generator.radius.max-retransmits"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.radius.max-retransmits"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="generator.radius.max-timeout"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.radius.max-timeout"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
      </Stack>
    </Fieldset>
  );
};

const PatternsConfig: FC = () => {
  const { data: cfg } = useConfig();

  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name: "generator.patterns.session-id" });

  const [buttonsWidth, setButtonsWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const merged = useMergedRef(inputRef, ref);

  return (
    <Fieldset legend="Patterns">
      <Stack gap="sm">
        <InputSideButtonsContext value={{ setButtonsWidth }}>
          <TextInput
            label={cfg?.["generator.patterns.session-id"]?.label}
            value={field.value}
            onChange={field.onChange}
            ref={merged}
            error={fieldState.isTouched && fieldState.error?.message}
            rightSectionWidth={buttonsWidth || undefined}
            rightSection={
              <InputSideButtons
                buttons={funcButtons}
                onChange={field.onChange}
                inputRef={inputRef}
              />
            }
          />
        </InputSideButtonsContext>
      </Stack>
    </Fieldset>
  );
};

const MiscConfigs: FC = () => {
  const { data: cfg } = useConfig();

  return (
    <Fieldset legend="Misc">
      <Stack gap="sm">
        <Controller
          name="generator.watcher-lifetime"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.watcher-lifetime"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="generator.max-var-tries"
          render={({ field, fieldState }) => (
            <NumberInput
              label={cfg?.["generator.max-var-tries"]?.label}
              min={0}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
      </Stack>
    </Fieldset>
  );
};

const GlobalSettingsView: FC = () => {
  const init = useAsyncValue() as GlobalConfig;
  const form = useForm({
    defaultValues: defaultValuesFromInit(init?.config),
  });

  const onSubmit = form.handleSubmit((values) => {
    const v = flattenObject(values);
    console.log("Form submitted with values:", v);
  });

  const theme = useMantineTheme();
  const { ref, width } = useElementSize();

  return (
    <FormProvider {...form}>
      <Group pos="relative" align="normal" gap="0" ref={ref}>
        <Stack gap="sm" p="md" maw={rem(700)} flex={1} miw={rem(570)}>
          <IPSourcesConfig />
          <JobsConfig />
          <RadiusConfig />
          <PatternsConfig />
          <MiscConfigs />
          <PluginsView />
        </Stack>
        <div
          style={
            width > 680
              ? {
                  position: "relative",
                  height: "100%",
                  paddingRight: theme.spacing.md,
                }
              : undefined
          }
        >
          <div
            style={
              width > 680
                ? {
                    position: "sticky",
                    top: `calc(${theme.spacing.sm} + 60px)`,
                    marginTop: `calc(${theme.spacing.md} + ${theme.spacing.sm})`,
                  }
                : {
                    padding: theme.spacing.md,
                    paddingTop: 0,
                  }
            }
          >
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={!form.formState.isDirty}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save
            </Button>
          </div>
        </div>
      </Group>
    </FormProvider>
  );
};

const GlobalSettings: FC = () => {
  const data = useLoaderData<typeof globalSettingsLoader>();

  return (
    <>
      <PageLayout title="Global Settings" suspense fullHeight={false}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await
            resolve={data.cfg}
            errorElement={<AwaitError before={null} />}
            children={<GlobalSettingsView />}
          />
        </Suspense>
      </PageLayout>
      <Outlet />
    </>
  );
};

export { GlobalSettings };

export const globalSettingsLoader = async () => {
  const globalConfigKey = getUseConfigKeyAndEnsureDefaults();

  return {
    cfg: queryClient.ensureQueryData<unknown, DefaultError, GlobalConfig>({
      queryKey: globalConfigKey,
    }),
  };
};
