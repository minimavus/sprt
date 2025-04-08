import { useEffect, type FC } from "react";
import {
  Button,
  Divider,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import cronstrue from "cronstrue";
import { AnimatePresence } from "framer-motion";
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler,
} from "react-hook-form";

import { fadeInClampOut } from "@/animations";
import { ColumnHeading } from "@/components/Columns";
import { DurationEdit } from "@/components/DurationEdit";
import { DisplayError } from "@/components/Error";
import { MotionedFlex } from "@/components/Motioned/MotionedFlex";
import { FormatTime } from "@/components/Time";
import {
  CleanerConfig,
  CleanerStatus,
  defaultCleanerCfgIFEmpty,
  useCleanerStatus,
  useCleanerUpdate,
} from "@/hooks/cleanups";

const ParsedCron: FC<{ cron: string }> = ({ cron }) => {
  const parsed = cronstrue.toString(cron, {
    throwExceptionOnParseError: false,
    verbose: true,
  });

  if (!parsed)
    return (
      <Text style={{ marginTop: 4 }} size="xs">
        Incorrect cron
      </Text>
    );

  return (
    <Text style={{ marginTop: 4 }} size="xs" c="dimmed">
      {parsed}
    </Text>
  );
};

const ScheduleEdit: FC<{ init: CleanerConfig }> = ({ init }) => {
  const { mutateAsync } = useCleanerUpdate();
  const form = useForm({ defaultValues: init });
  useEffect(() => {
    form.reset(init);
  }, [init]);

  const onSubmit: SubmitHandler<CleanerConfig> = async (values) => {
    await mutateAsync(values);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Controller<CleanerConfig, "cron">
          name="cron"
          render={({ field }) => (
            <>
              <TextInput {...field} label="Cron" />
              <ParsedCron cron={field.value} />
            </>
          )}
        />
        <Controller<CleanerConfig, "older_than">
          name="older_than"
          render={({ field }) => (
            <DurationEdit
              {...field}
              label="Remove sessions older than"
              mt="sm"
            />
          )}
        />
        <Button type="submit" mt="sm" loading={form.formState.isSubmitting}>
          Save
        </Button>
      </form>
    </FormProvider>
  );
};

const DisplayCleanupSettings: FC<{ data: CleanerConfig }> = ({ data }) => {
  const { mutateAsync, isPending } = useCleanerUpdate();
  return (
    <Stack gap="sm">
      <Switch
        checked={data.enabled}
        onChange={(e) => {
          mutateAsync(
            e.target.checked
              ? defaultCleanerCfgIFEmpty({ ...data, enabled: true })
              : { ...data, enabled: e.target.checked },
          );
        }}
        disabled={isPending}
        label="Enable auto-cleanups of outdated sessions"
      />
      <AnimatePresence initial={false}>
        {data.enabled ? (
          <MotionedFlex {...fadeInClampOut} gap="sm" direction="column">
            <ScheduleEdit init={data} />
          </MotionedFlex>
        ) : null}
      </AnimatePresence>
    </Stack>
  );
};

const CleanupRuns: FC<{ runs: CleanerStatus["runs"] }> = ({ runs }) => {
  if (!runs) {
    return null;
  }

  return (
    <>
      <Divider size="xs" mt="sm" mb="sm" />
      {runs.last_run ? (
        <Text c="dimmed">
          Last run: <FormatTime t={runs.last_run} showTZ />
        </Text>
      ) : null}
      {runs.next_run ? (
        <Text c="dimmed">
          Next run: <FormatTime t={runs.next_run} showTZ />
        </Text>
      ) : null}
    </>
  );
};

const CleanupSettings: FC = () => {
  const { data, status, error } = useCleanerStatus();
  const theme = useMantineTheme();
  return (
    <>
      <ColumnHeading mb="xs">Settings</ColumnHeading>
      {status === "pending" ? (
        Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} height={theme.spacing.md} radius="xl" mb="sm" />
        ))
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : data ? (
        <>
          <DisplayCleanupSettings data={data.config} />
          {data.config.enabled ? <CleanupRuns runs={data.runs} /> : null}
        </>
      ) : (
        <Text>No data, weird...</Text>
      )}
    </>
  );
};

export { CleanupSettings };
