import { FC, Suspense, useRef, useState } from "react";
import {
  Button,
  Code,
  Fieldset,
  NumberInput,
  rem,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useMergedRef } from "@mantine/hooks";
import { DefaultError } from "@tanstack/react-query";
import {
  Controller,
  FormProvider,
  useController,
  useForm,
  useWatch,
} from "react-hook-form";
import {
  Await,
  LoaderFunctionArgs,
  Outlet,
  useAsyncValue,
  useLoaderData,
} from "react-router-dom";

import { AwaitError, DisplayError } from "@/components/Error";
import {
  InputSideButtons,
  InputSideButtonsContext,
} from "@/components/Inputs/InputSideButtons";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { GlobalConfig } from "@/hooks/config/schemas";
import {
  getUseConfigKeyAndEnsureDefaults,
  useConfig,
} from "@/hooks/config/useConfig";
import { InputSideButton } from "@/hooks/generate/schemas";
import { useNADSourcesAll } from "@/hooks/generate/useNADSources";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";
import { flattenObject } from "@/utils/flattenObject";
import set from "@/utils/set";

const defaultValuesFromInit = (init: GlobalConfig["config"]) => {
  return Object.keys(init).reduce(
    (acc, key) => {
      return set(key, init[key as keyof typeof init].value, acc);
    },
    {} as Record<string, unknown>,
  );
};

const IPSourcesPatterns: FC = () => {
  const [u] = useQueryUser();
  const { data } = useNADSourcesAll(u);
  const { data: cfg } = useConfig();

  return (
    <Stack gap="sm">
      <Text size="sm">
        SPRT automatically detects all available source addresses and
        interfaces. The user can then select a source from the resulting list.
        If exclusion patterns are defined, matching sources will be removed from
        the list. If inclusion patterns are defined, only sources that match
        will be included.
      </Text>
      <TextInput label={cfg?.["generator.source-ip.exclude"]?.label} />
      <TextInput label={cfg?.["generator.source-ip.allowed"]?.label} />
    </Stack>
  );
};

const IPSourcesExplicit: FC = () => {
  const { data: cfg } = useConfig();

  return (
    <Stack gap="sm">
      <Text size="sm">
        Explicit source addresses are used. The user can choose one from a list
        of available sources. The selected address will be set as the
        <Code>NAS-IP-Address</Code> (or <Code>NAS-IPv6-Address</Code>) in RADIUS
        packets. Routing will determine which interface is used for sending.
      </Text>
      <TextInput label={cfg?.["generator.source-ip.explicit-sources"]?.label} />
    </Stack>
  );
};

const IPSourcesConfig: FC = () => {
  const [u] = useQueryUser();
  const { error, status } = useNADSourcesAll(u);
  const { data: cfg } = useConfig();

  const autoDetect = useWatch({
    name: "generator.source-ip.auto-detect",
  });

  if (status === "pending") return <>Loading IP sources</>;
  if (status === "error") {
    return <DisplayError error={error} before="Failed to load IP sources" />;
  }

  return (
    <Fieldset legend="IP Sources">
      <Stack gap="sm">
        <Controller
          name="generator.source-ip.auto-detect"
          render={({ field, fieldState }) => (
            <Switch
              label={cfg?.["generator.source-ip.auto-detect"]?.label}
              checked={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        {autoDetect ? <IPSourcesPatterns /> : <IPSourcesExplicit />}
      </Stack>
    </Fieldset>
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

const funcButtons: InputSideButton[] = [
  {
    title: "Insert",
    icon: "",
    type: "dropdown",
    values: [
      {
        title: "Functions",
        type: "group",
        values: [
          {
            insert: true,
            title: "Random number",
            type: "value",
            value: "rand()",
          },
          {
            insert: true,
            title: "Random string",
            type: "value",
            value: "randstr()",
          },
          {
            insert: true,
            title: "Convert to HEX",
            type: "value",
            value: "hex()",
          },
          {
            insert: true,
            title: "Conver to OCT",
            type: "value",
            value: "oct()",
          },
          {
            insert: true,
            title: "To UPPER case",
            type: "value",
            value: "uc()",
          },
          {
            insert: true,
            title: "To lower case",
            type: "value",
            value: "lc()",
          },
          {
            insert: true,
            title: "Remove delimiters",
            type: "value",
            value: "no_delimiters()",
          },
        ],
      },
      {
        title: "Variables",
        type: "group",
        values: [
          {
            insert: true,
            title: "MAC address",
            type: "value",
            value: "$MAC$",
          },
        ],
      },
    ],
  },
];

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

  return (
    <FormProvider {...form}>
      <Stack gap="sm" p="md" maw={rem(700)} flex={1}>
        <IPSourcesConfig />
        <JobsConfig />
        <RadiusConfig />
        <PatternsConfig />
        <MiscConfigs />
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
