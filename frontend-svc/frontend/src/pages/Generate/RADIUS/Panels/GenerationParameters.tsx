import { type FC } from "react";
import { Stack, Switch, TextInput, Title } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import { DisableableNumberInput } from "@/components/Inputs/DisableableNumberInput";
import { InputHelp } from "@/components/Inputs/InputHelp";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";
import { formatNumber } from "@/utils/strings";

import type { RadiusForm } from "../form";
import { useFieldState } from "../formStateContext";
import { useMaxAmountOfSessions } from "../hooks/useMaxAmountOfSessions";

export const GenerationParameters: FC = () => {
  const maxAmountOfSessions = useMaxAmountOfSessions();
  const [shouldSave, shouldAcctStart] = useWatch<
    RadiusForm,
    ["general.job.saveSessions", "general.job.withAcctStart"]
  >({
    name: ["general.job.saveSessions", "general.job.withAcctStart"],
  });

  return (
    <Stack gap="sm">
      <Title order={3}>Generation Parameters</Title>
      <Controller<RadiusForm, "general.job.name">
        name="general.job.name"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Job Name"
            error={getErrorMessage(error)}
            id="job-name"
            disabled={useFieldState("general.job.name") === "disabled"}
          />
        )}
      />
      <Controller<RadiusForm, "general.job.sessionsAmount">
        name="general.job.sessionsAmount"
        render={({ field, fieldState: { error } }) => (
          <DisableableNumberInput
            {...field}
            label="Amount of Sessions"
            description={`up to ${formatNumber(maxAmountOfSessions)}`}
            error={getErrorMessage(error)}
            id="sessions-amount"
            className={styles.compact}
            disabled={
              useFieldState("general.job.sessionsAmount") === "disabled"
            }
            disabledValue="Auto"
          />
        )}
      />
      <Controller<RadiusForm, "general.job.latency">
        name="general.job.latency"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label={
              <>
                Latency between sessions
                <InputHelp help="Can be integer or range in format 'N1..N2'. If range is specified, random number will be used from the range." />
              </>
            }
            description="milliseconds"
            error={getErrorMessage(error)}
            id="latency"
            className={styles.compact}
            disabled={useFieldState("general.job.latency") === "disabled"}
          />
        )}
      />
      <Controller<RadiusForm, "general.job.multiThread">
        name="general.job.multiThread"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="multi-thread"
            label="Multi-thread"
            disabled={useFieldState("general.job.multiThread") === "disabled"}
          />
        )}
      />
      <Controller<RadiusForm, "general.job.saveSessions">
        name="general.job.saveSessions"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="save-sessions"
            label="Save sessions"
            disabled={useFieldState("general.job.saveSessions") === "disabled"}
          />
        )}
      />
      {shouldSave ? (
        <Controller<RadiusForm, "general.job.bulkName">
          name="general.job.bulkName"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label="Bulk Name"
              error={getErrorMessage(error)}
              id="bulk-name"
            />
          )}
        />
      ) : null}
      <Controller<RadiusForm, "general.job.withAcctStart">
        name="general.job.withAcctStart"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="with-acct-start"
            label="Send Accounting-Start if authentication was successful"
          />
        )}
      />
      {shouldAcctStart ? (
        <Controller<RadiusForm, "general.job.latencyAcctStart">
          name="general.job.latencyAcctStart"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label={
                <>
                  Delay{" "}
                  <InputHelp help="Delay after successful authentication before sending Accounting-Start. Can be integer or range in format 'N1..N2'. If range is specified, random number will be used from the range." />
                </>
              }
              description="milliseconds"
              error={getErrorMessage(error)}
              id="latency-acct-start"
              className={styles.compact}
            />
          )}
        />
      ) : null}
      <Controller<RadiusForm, "general.job.withDACL">
        name="general.job.withDACL"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="with-dacl"
            label="Download DACLs"
          />
        )}
      />
    </Stack>
  );
};
