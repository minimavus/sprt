import { useState, type FC } from "react";
import {
  Button,
  Checkbox,
  ComboboxData,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { getErrorMessage } from "@/utils/errors";

import type { ActionModalProps } from ".";
import { mapSelectedToIDs } from "./mapSelectedToIDs";
import { AcctSessionTime } from "./parts/AcctSessionTime";
import { Server } from "./parts/Server";
import {
  ActionModal,
  ServerProps,
  SessionTimeVariant,
  SharedFlags,
} from "./types";

const AcctStatusType = [
  { value: "1", label: "Start" },
  { value: "2", label: "Stop" },
  { value: "3", label: "Interim-Update" },
  { value: "7", label: "Accounting-On" },
  { value: "8", label: "Accounting-Off" },
  { value: "15", label: "Failed" },
] as const satisfies ComboboxData;

type AcctStatusType = (typeof AcctStatusType)[number]["value"];

type InterimUpdateFormData = {
  flags: SharedFlags;
  attributes: {
    acctStatusType: AcctStatusType;
    acctSessionId?: string;
    callingStationId?: string;
    framedIPAddress?: string;
    acctSessionTimeVariant: SessionTimeVariant;
    acctSessionTime?: number;
    acctInputOctets?: number;
    acctOutputOctets?: number;
    acctInputPackets?: number;
    acctOutputPackets?: number;
    additionalAttributes: string;
  };
} & ServerProps;

const getDefaults =
  (
    selected:
      | NonNullable<ActionModalProps<"interimUpdate">["payload"]>["sessions"]
      | undefined,
    sessions: ActionModalProps<"interimUpdate">["sessions"],
  ): (() => Promise<InterimUpdateFormData | Record<string, never>>) =>
  async () => {
    if (sessions === undefined || selected === undefined || sessions === null) {
      return {};
    }

    const defaultValues: InterimUpdateFormData = {
      flags: {
        _multiple: true,
        multiThread: true,
        differentServer: false,
      },
      server: {
        address: "",
        acctPort: 1813,
        shared: "",
        sourceIP: "",
      },
      attributes: {
        acctStatusType: "3",
        acctSessionTimeVariant: "sinceStart",
        acctSessionTime: 0,
        acctInputOctets: 0,
        acctOutputOctets: 0,
        acctInputPackets: 0,
        acctOutputPackets: 0,
        additionalAttributes: "",
      },
    };

    if (Array.isArray(selected) && selected.length === 1) {
      const sess = sessions?.find((s) => s.id === selected[0]);
      if (sess === undefined) {
        return defaultValues;
      }
      defaultValues.attributes.acctSessionId =
        sess.sessid === null ? undefined : sess.sessid;
      defaultValues.attributes.callingStationId =
        sess.mac === null ? undefined : sess.mac;
      defaultValues.attributes.framedIPAddress =
        sess.ipAddr === null ? undefined : sess.ipAddr;
      defaultValues.flags._multiple = false;
    }

    return defaultValues;
  };

const Attributes: FC = () => {
  const isMultiple = useWatch({ name: "flags._multiple" });

  return (
    <Stack gap="sm">
      {!isMultiple ? (
        <>
          <Controller<InterimUpdateFormData, "attributes.acctSessionId">
            name="attributes.acctSessionId"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Acct-Session-ID"
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<InterimUpdateFormData, "attributes.callingStationId">
            name="attributes.callingStationId"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Calling-Station-ID"
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<InterimUpdateFormData, "attributes.framedIPAddress">
            name="attributes.framedIPAddress"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Framed-IP-Address"
                error={getErrorMessage(error)}
              />
            )}
          />
        </>
      ) : null}
      <Controller<InterimUpdateFormData, "attributes.acctStatusType">
        name="attributes.acctStatusType"
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            data={AcctStatusType}
            label="Acct-Status-Type"
            error={getErrorMessage(error)}
          />
        )}
      />
      <AcctSessionTime />
      <Group flex={1} gap="xs">
        <Controller<InterimUpdateFormData, "attributes.acctInputOctets">
          name="attributes.acctInputOctets"
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Input-Octets"
              error={getErrorMessage(error)}
              flex={1}
            />
          )}
        />
        <Controller<InterimUpdateFormData, "attributes.acctOutputOctets">
          name="attributes.acctOutputOctets"
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Output-Octets"
              error={getErrorMessage(error)}
              flex={1}
            />
          )}
        />
      </Group>
      <Group flex={1} gap="xs">
        <Controller<InterimUpdateFormData, "attributes.acctInputPackets">
          name="attributes.acctInputPackets"
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Input-Packets"
              error={getErrorMessage(error)}
              flex={1}
            />
          )}
        />
        <Controller<InterimUpdateFormData, "attributes.acctOutputPackets">
          name="attributes.acctOutputPackets"
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Acct-Output-Packets"
              error={getErrorMessage(error)}
              flex={1}
            />
          )}
        />
      </Group>
      <Controller<InterimUpdateFormData, "attributes.additionalAttributes">
        name="attributes.additionalAttributes"
        render={({ field, fieldState: { error } }) => (
          <Textarea
            {...field}
            label="Additional attributes"
            autosize
            minRows={3}
            maxRows={15}
            error={getErrorMessage(error)}
          />
        )}
      />
      <Divider />
      <Controller<InterimUpdateFormData, "flags.multiThread">
        name="flags.multiThread"
        render={({ field: { value, ...field } }) => (
          <Checkbox {...field} checked={value} label="Multi-thread" />
        )}
      />
    </Stack>
  );
};

const API: FC = () => {
  return <Text>API</Text>;
};

type TabName = "attributes" | "server" | "api";

export const InterimUpdate: ActionModal<"interim-update"> = ({
  onClose,
  payload,
  selected,
  sessions,
}) => {
  const [tab, setTab] = useState<TabName>("attributes");

  const form = useForm({
    defaultValues: getDefaults(
      mapSelectedToIDs<"interimUpdate">(payload, selected, sessions),
      sessions,
    ),
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <Tabs
            value={tab}
            onChange={(v) => setTab((v as TabName) || "attributes")}
          >
            <Tabs.List>
              <Tabs.Tab value="attributes">Attributes</Tabs.Tab>
              <Tabs.Tab value="server">Server</Tabs.Tab>
              <Tabs.Tab value="api">API</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="attributes" pt="sm">
              <Attributes />
            </Tabs.Panel>
            <Tabs.Panel value="server" pt="sm">
              <Server />
            </Tabs.Panel>
            <Tabs.Panel value="api" pt="sm">
              <API />
            </Tabs.Panel>
          </Tabs>
          <ModalFooter>
            <Button type="button" onClick={onClose as any} variant="default">
              Cancel
            </Button>
            <Button type="submit">Send</Button>
          </ModalFooter>
        </Stack>
      </form>
    </FormProvider>
  );
};

InterimUpdate.modalTitle = "Interim Update";
