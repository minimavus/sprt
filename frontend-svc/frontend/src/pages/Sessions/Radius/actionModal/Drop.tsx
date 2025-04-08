import { useState, type FC } from "react";
import {
  Button,
  Checkbox,
  ComboboxData,
  Divider,
  NumberInput,
  Select,
  Stack,
  Tabs,
  TextInput,
} from "@mantine/core";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { maybeError } from "@/utils/errors";

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

const TerminateCause = [
  { label: "User Request", value: "1" },
  { label: "Lost Carrier", value: "2" },
  { label: "Lost Service", value: "3" },
  { label: "Idle Timeout", value: "4" },
  { label: "Session Timeout", value: "5" },
  { label: "Admin Reset", value: "6" },
  { label: "Admin Reboot", value: "7" },
  { label: "Port Error", value: "8" },
  { label: "NAS Error", value: "9" },
  { label: "NAS Request", value: "10" },
  { label: "NAS Reboot", value: "11" },
  { label: "Port Unneeded", value: "12" },
  { label: "Port Preempted", value: "13" },
  { label: "Port Suspended", value: "14" },
  { label: "Service Unavailable", value: "15" },
  { label: "Callback", value: "16" },
  { label: "User Error", value: "17" },
  { label: "Host Request", value: "18" },
] as const satisfies ComboboxData;

type TerminateCause = (typeof TerminateCause)[number]["value"];

export type DropFormData = {
  flags: {
    keepInDb: boolean;
  } & SharedFlags;
  attributes: {
    acctSessionId?: string;
    callingStationId?: string;
    framedIPAddress?: string;
    acctTerminateCause: TerminateCause;
    acctSessionTimeVariant: SessionTimeVariant;
    acctSessionTime?: number;
    acctDelayTime: number;
  };
} & ServerProps;

const getDefaults =
  (
    selected:
      | NonNullable<ActionModalProps<"drop">["payload"]>["sessions"]
      | undefined,
    sessions: ActionModalProps<"drop">["sessions"],
  ): (() => Promise<DropFormData | Record<string, never>>) =>
  async () => {
    if (sessions === undefined || selected === undefined || sessions === null) {
      return {};
    }

    const defaultValues: DropFormData = {
      flags: {
        _multiple: true,
        keepInDb: false,
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
        acctTerminateCause: "6",
        acctSessionTimeVariant: "sinceStart",
        acctSessionTime: 0,
        acctDelayTime: 0,
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
          <Controller<DropFormData, "attributes.acctSessionId">
            name="attributes.acctSessionId"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Acct-Session-ID"
                error={maybeError(error)}
              />
            )}
          />
          <Controller<DropFormData, "attributes.callingStationId">
            name="attributes.callingStationId"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Calling-Station-ID"
                error={maybeError(error)}
              />
            )}
          />
          <Controller<DropFormData, "attributes.framedIPAddress">
            name="attributes.framedIPAddress"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Framed-IP-Address"
                error={maybeError(error)}
              />
            )}
          />
        </>
      ) : null}
      <Controller<DropFormData, "attributes.acctTerminateCause">
        name="attributes.acctTerminateCause"
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            data={TerminateCause}
            label="Acct-Terminate-Cause"
            error={maybeError(error)}
          />
        )}
      />
      <AcctSessionTime />
      <Controller<DropFormData, "attributes.acctDelayTime">
        name="attributes.acctDelayTime"
        render={({ field, fieldState: { error } }) => (
          <NumberInput
            {...field}
            label="Acct-Delay-Time"
            error={maybeError(error)}
          />
        )}
      />
      <Divider />
      <Controller<DropFormData, "flags.keepInDb">
        name="flags.keepInDb"
        render={({ field: { value, ...field } }) => (
          <Checkbox {...field} checked={value} label="Keep sessions in DB" />
        )}
      />
      <Controller<DropFormData, "flags.multiThread">
        name="flags.multiThread"
        render={({ field: { value, ...field } }) => (
          <Checkbox {...field} checked={value} label="Multi-thread" />
        )}
      />
    </Stack>
  );
};

const API: FC = () => {
  return <>API</>;
};

type TabName = "attributes" | "server" | "api";

export const Drop: ActionModal<"drop"> = ({
  onClose,
  payload,
  sessions,
  selected,
}) => {
  const [tab, setTab] = useState<TabName>("attributes");

  const form = useForm({
    defaultValues: getDefaults(
      mapSelectedToIDs<"drop">(payload, selected, sessions),
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
          <Tabs value={tab} onChange={(v) => setTab(v as TabName)}>
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
            <Button type="submit">Drop</Button>
          </ModalFooter>
        </Stack>
      </form>
    </FormProvider>
  );
};

Drop.modalTitle = "Drop";
