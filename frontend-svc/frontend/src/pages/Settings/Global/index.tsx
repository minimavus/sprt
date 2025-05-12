import { Suspense, useRef, useState, type FC } from "react";
import {
  ActionIcon,
  Button,
  Code,
  Fieldset,
  Group,
  InputLabel,
  NumberInput,
  rem,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { useElementSize, useMergedRef } from "@mantine/hooks";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { DefaultError } from "@tanstack/react-query";
import {
  Controller,
  FormProvider,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Await,
  Outlet,
  useAsyncValue,
  useLoaderData,
  type LoaderFunctionArgs,
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
import { useNADSourcesAll } from "@/hooks/generate/useNADSources";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";
import { flattenObject } from "@/utils/flattenObject";
import set from "@/utils/set";

import { funcButtons } from "./funcButtons";

const defaultValuesFromInit = (init: GlobalConfig["config"]) => {
  return Object.keys(init).reduce(
    (acc, key) => {
      return set(key, init[key as keyof typeof init].value, acc);
    },
    {} as Record<string, unknown>,
  );
};

const ListEdit: FC<{
  label?: string;
  name: string;
}> = ({ label, name }) => {
  const { register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name });

  return (
    <Stack gap="xs">
      <InputLabel>{label}</InputLabel>
      <Table>
        <Table.Tbody>
          {fields.map((v, i) => (
            <Table.Tr key={v.id}>
              <Table.Td>
                <Group gap="xs">
                  <TextInput {...register(`${name}.${i}`)} flex={1} />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => remove(i)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td colSpan={2}>
              <TextInput
                placeholder="Add new pattern: start typing..."
                value=""
                onChange={(e) => {
                  if (e.target.value.length > 0) {
                    append(e.target.value, {
                      shouldFocus: true,
                      focusName: `${name}.${fields.length}`,
                    });
                  }
                }}
              />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Stack>
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
      <ListEdit
        label={cfg?.["generator.source-ip.exclude"]?.label}
        name="generator.source-ip.exclude"
      />
      <ListEdit
        label={cfg?.["generator.source-ip.allowed"]?.label}
        name="generator.source-ip.allowed"
      />
      <div>
        <Button variant="subtle" size="compact-sm">
          Show matching sources
        </Button>
      </div>
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
      <ListEdit
        label={cfg?.["generator.source-ip.explicit-sources"]?.label}
        name="generator.source-ip.explicit-sources"
      />
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
