import {
  Accordion,
  type ComboboxData,
  NumberInput,
  noop,
  Select,
  SimpleGrid,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import type { FC } from "react";
import { Controller, useController } from "react-hook-form";

import { Cron } from "@/components/Inputs/Cron";
import { getErrorMessage } from "@/utils/errors";

import type { RadiusForm } from "../../form";

const AcctSessionTimeOptions: ComboboxData = [
  { value: "since-start", label: "Seconds since start" },
  { value: "since-last", label: "Seconds since last change" },
];

const Attributes: FC = () => {
  return (
    <Stack gap="sm">
      <TextInput
        disabled
        label="Acct-Status-Type"
        value="Interim-Update"
        onChange={noop}
      />
      <TextInput
        disabled
        label="Acct-Session-Id"
        value="$SESSION_ID$"
        onChange={noop}
      />
      <TextInput
        disabled
        label="Calling-Station-Id"
        value="$MAC$"
        onChange={noop}
      />
      <TextInput
        disabled
        label="Framed-IP-Address"
        value="$IP$"
        onChange={noop}
      />
      <Controller<RadiusForm, "scheduler.attributes.acctSessionTime">
        name="scheduler.attributes.acctSessionTime"
        defaultValue="since-start"
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            label="Acct-Session-Time"
            data={AcctSessionTimeOptions}
            error={getErrorMessage(error)}
            allowDeselect={false}
          />
        )}
      />
      <SimpleGrid cols={2} spacing="sm">
        <Controller<RadiusForm, "scheduler.attributes.acctInputOctets">
          name="scheduler.attributes.acctInputOctets"
          defaultValue={0}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Input-Octets"
              error={getErrorMessage(error)}
            />
          )}
        />
        <Controller<RadiusForm, "scheduler.attributes.acctOutputOctets">
          name="scheduler.attributes.acctOutputOctets"
          defaultValue={0}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Output-Octets"
              error={getErrorMessage(error)}
            />
          )}
        />
      </SimpleGrid>
      <SimpleGrid cols={2} spacing="sm">
        <Controller<RadiusForm, "scheduler.attributes.acctInputPackets">
          name="scheduler.attributes.acctInputPackets"
          defaultValue={0}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Input-Packets"
              error={getErrorMessage(error)}
            />
          )}
        />
        <Controller<RadiusForm, "scheduler.attributes.acctOutputPackets">
          name="scheduler.attributes.acctOutputPackets"
          defaultValue={0}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Output-Packets"
              error={getErrorMessage(error)}
            />
          )}
        />
      </SimpleGrid>
      <Controller<RadiusForm, "scheduler.attributes.additional">
        name="scheduler.attributes.additional"
        defaultValue={[]}
        render={({ field, fieldState: { error } }) => (
          <Textarea
            {...field}
            label="Additional attributes"
            error={getErrorMessage(error)}
            description="One per line, format: attribute=value"
            autosize
            maxRows={15}
            minRows={2}
            // FIXME: use "Add attribute" button and add from dictionaries
          />
        )}
      />
    </Stack>
  );
};

export const InterimUpdatesScheduleParameters: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController<RadiusForm, "scheduler.cron">({
    name: "scheduler.cron",
    defaultValue: "0 */2 * * *",
  });

  return (
    <>
      <Cron
        legend="Schedule"
        leadingZero
        {...field}
        error={getErrorMessage(error, true)}
        shortcuts={["@hourly", "@daily", "@weekly", "@monthly"]}
      />
      <Accordion defaultValue={null} radius="sm" variant="separated">
        <Accordion.Item key="attributes" value="attributes">
          <Accordion.Control>Attributes</Accordion.Control>
          <Accordion.Panel>
            <Attributes />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  );
};
