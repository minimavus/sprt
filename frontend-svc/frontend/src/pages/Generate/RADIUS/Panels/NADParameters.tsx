import { type FC } from "react";
import {
  Grid,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { Controller } from "react-hook-form";

import { useNADSourcesCombined } from "@/hooks/generate/useNADSources";
import { useQueryUser } from "@/hooks/useQueryUser";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import type { RadiusForm } from "../form";
import { useConnectionTypes } from "../hooks/useConnectionTypes";
import { useMaxRetransmits, useMaxTimeout } from "../hooks/useMax";

const NADSourceAddress: FC = () => {
  const [u] = useQueryUser();
  const { data: options } = useNADSourcesCombined(u);

  return (
    <Controller<RadiusForm, "general.nas.nasIp">
      name="general.nas.nasIp"
      render={({ field, fieldState: { error } }) => (
        <Select
          data={options}
          {...field}
          label="Source IP"
          description="NAS-IP-Address"
          error={getErrorMessage(error)}
          multiple={false}
          className={styles.compact}
        />
      )}
    />
  );
};

const ConnectionType: FC = () => {
  const type = useConnectionTypes();

  return (
    <Controller<RadiusForm, "general.nas.connectionType">
      name="general.nas.connectionType"
      render={({ field, fieldState: { error } }) => (
        <Select
          data={type}
          {...field}
          label="Connection Type"
          description="NAS-Port-Type"
          error={getErrorMessage(error)}
          multiple={false}
          className={styles.compact}
        />
      )}
    />
  );
};

export const NADParameters: FC = () => {
  const maxRetransmits = useMaxRetransmits();
  const maxTimeout = useMaxTimeout();

  return (
    <Stack gap="sm">
      <Title order={3}>Network Access Device</Title>
      <NADSourceAddress />
      <ConnectionType />
      <Controller<RadiusForm, "general.nas.mtu">
        name="general.nas.mtu"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="MTU"
            description="Framed-MTU"
            type="number"
            error={getErrorMessage(error)}
            id="mtu"
            className={styles.compact}
          />
        )}
      />
      <Controller<RadiusForm, "general.nas.sessionIdTemplate">
        name="general.nas.sessionIdTemplate"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Session ID Template"
            description="Variable name: $SESSION_ID$"
            error={getErrorMessage(error)}
            id="session-id-template"
            className={styles.compact}
          />
        )}
      />
      <Grid gutter="xs">
        <Grid.Col span={6}>
          <Controller<RadiusForm, "general.nas.timeout">
            name="general.nas.timeout"
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                {...field}
                label="Timeout"
                description={`seconds${
                  maxTimeout ? `, up to ${maxTimeout}` : ""
                }`}
                max={maxTimeout || undefined}
                min={1}
                error={getErrorMessage(error)}
                id="timeout"
                className={styles.compact}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Controller<RadiusForm, "general.nas.retransmits">
            name="general.nas.retransmits"
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                {...field}
                description={
                  maxRetransmits ? `up to ${maxRetransmits}` : undefined
                }
                label="Retransmits"
                error={getErrorMessage(error)}
                id="retransmits"
                className={styles.compact}
                min={0}
                max={maxRetransmits || undefined}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
