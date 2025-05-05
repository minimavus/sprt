import { useMemo, type FC } from "react";
import {
  ComboboxItemGroup,
  Grid,
  NumberInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { Controller } from "react-hook-form";

import { useNADSources } from "@/hooks/generate/useNADSources";
import { useQueryUser } from "@/hooks/useQueryUser";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import type { RadiusForm } from "../form";
import { useConnectionTypes } from "../hooks/useConnectionTypes";
import { useMaxRetransmits } from "../hooks/useMaxRetransmits";

const FamilyName: Record<string, string> = {
  "4": "IPv4",
  "6": "IPv6",
};

const NADSourceAddress: FC = () => {
  const [u] = useQueryUser();
  const { data } = useNADSources(u);

  const options = useMemo(() => {
    if (!data) return [];

    return data
      .reduce((acc, source) => {
        const familyName = FamilyName[source.family] ?? source.family;
        const group = acc.find((g) => g.group === familyName);
        const compiled = {
          value: source.address,
          label: source.interface
            ? `${source.address} (${source.interface})`
            : source.address,
        };
        if (group) {
          group.items.push(compiled);
        } else {
          acc.push({ group: familyName, items: [compiled] });
        }
        return acc;
      }, [] as ComboboxItemGroup[])
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [data]);

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
                description="seconds"
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
