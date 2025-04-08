import type { FC } from "react";
import {
  Collapse,
  Divider,
  Group,
  Select,
  SelectProps,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { Controller, useController } from "react-hook-form";

import {
  ErrCause,
  ErrCauseList,
  NoSessionActionValues,
  NoSessionDmActionValues,
  ServerSettings,
} from "@/hooks/settings/servers";
import { getErrorMessage } from "@/utils/errors";

const NoSessionActionOptions: {
  label: string;
  value: (typeof NoSessionActionValues)[number];
}[] = [
  {
    value: "coa-ack",
    label: "CoA-ACK",
  },
  {
    value: "coa-nak",
    label: "CoA-NAK",
  },
  {
    value: "drop",
    label: "Drop",
  },
];

const NoSessionDmActionOptions: {
  label: string;
  value: (typeof NoSessionDmActionValues)[number];
}[] = [
  {
    value: "disconnect-ack",
    label: "Disconnect-ACK",
  },
  {
    value: "disconnect-nak",
    label: "Disconnect-NAK",
  },
];

type ErrCauseOption = {
  label: string;
  value: ErrCause;
};

const composeErrCauseOptions = () => {
  const result: (
    | ErrCauseOption
    | { group: string; items: ErrCauseOption[] }
  )[] = [] satisfies SelectProps["data"];

  for (const cs of ErrCauseList) {
    if (cs.code === "group") {
      result.push({ group: cs.explain, items: [] });
      continue;
    }

    if (result.length === 0) {
      result.push({ label: cs.explain, value: cs.code });
      continue;
    }

    const l = result[result.length - 1];
    if (typeof l === "object" && "items" in l) {
      l.items.push({ label: cs.explain, value: cs.code });
    } else {
      result.push({ label: cs.explain, value: cs.code });
    }
  }

  return result;
};

const ErrCauseOptions = composeErrCauseOptions();

const GeneralRadiusFields: FC = () => {
  return (
    <>
      <Group gap="xs">
        <Controller<ServerSettings, "auth_port">
          name="auth_port"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              label="Authentication port"
              type="number"
              error={getErrorMessage(error)}
              {...field}
            />
          )}
        />{" "}
        <Controller<ServerSettings, "acct_port">
          name="acct_port"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              label="Accounting port"
              type="number"
              error={getErrorMessage(error)}
              {...field}
            />
          )}
        />
      </Group>
      <Controller<ServerSettings, "attributes.shared">
        name="attributes.shared"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            label="Shared secret"
            error={getErrorMessage(error)}
            {...field}
          />
        )}
      />
    </>
  );
};

const COARadiusFields: FC = () => {
  const {
    field: { value: checked, ...toggleProps },
  } = useController<ServerSettings, "coa">({
    name: "coa",
  });

  return (
    <>
      <Switch
        {...toggleProps}
        checked={checked}
        label="Handle Dynamic Authorization (RFC3576)"
      />
      <Collapse in={checked}>
        <Divider
          my="xs"
          label="If session not found on CoA-Request"
          labelPosition="left"
        />
        <Stack gap="sm" pl="md" pr="sm">
          <Controller<ServerSettings, "attributes.no_session_action">
            name="attributes.no_session_action"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Action"
                data={NoSessionActionOptions}
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<ServerSettings, "attributes.coa_nak_err_cause">
            name="attributes.coa_nak_err_cause"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Error-Cause"
                data={ErrCauseOptions}
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
        </Stack>

        <Divider
          mb="xs"
          mt="lg"
          label="If session not found on Disconnect-Request"
          labelPosition="left"
        />
        <Stack gap="sm" pl="md" pr="sm">
          <Controller<ServerSettings, "attributes.no_session_dm_action">
            name="attributes.no_session_dm_action"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Action"
                data={NoSessionDmActionOptions}
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<ServerSettings, "attributes.dm_err_cause">
            name="attributes.dm_err_cause"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Error-Cause"
                data={ErrCauseOptions}
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
        </Stack>
      </Collapse>
    </>
  );
};

export const RadiusFields: FC = () => {
  const {
    field: { value: checked, ...toggleProps },
  } = useController<ServerSettings, "attributes.radius">({
    name: "attributes.radius",
  });

  return (
    <Stack gap="sm">
      <Switch {...toggleProps} checked={checked} label="Enabled" />
      {checked ? (
        <>
          <GeneralRadiusFields />
          <COARadiusFields />
        </>
      ) : null}
    </Stack>
  );
};
