import { useMemo, type FC } from "react";
import {
  Collapse,
  ComboboxData,
  ComboboxItemGroup,
  Select,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { Controller, useController } from "react-hook-form";

import { useIPSources } from "@/hooks/useIPSources";
import { maybeError } from "@/utils/errors";

import { FormDataFlags, ServerProps } from "../types";

export const Server: FC = () => {
  const useDifferentServer = useController<
    FormDataFlags,
    "flags.differentServer"
  >({
    name: "flags.differentServer",
  });

  const { data } = useIPSources();
  const options: ComboboxData = useMemo(() => {
    if (data === undefined) {
      return [];
    }

    const mapped = [];
    if (Array.isArray(data.ipv4) && data.ipv4.length > 0) {
      mapped.push({
        group: "IPv4",
        items: data.ipv4.map((ip) => ({
          label: `${ip.address} (${ip.interface})`,
          value: ip.address,
        })),
      } as ComboboxItemGroup);
    }
    if (Array.isArray(data.ipv6) && data.ipv6.length > 0) {
      mapped.push({
        group: "IPv6",
        items: data.ipv6.map((ip) => ({
          label: `${ip.address} (${ip.interface})`,
          value: ip.address,
        })),
      } as ComboboxItemGroup);
    }

    return mapped;
  }, [data]);

  return (
    <Stack gap="sm">
      <Switch
        {...useDifferentServer.field}
        value=""
        checked={useDifferentServer.field.value}
        label="Send accounting to different server"
      />
      <Collapse in={Boolean(useDifferentServer.field.value)}>
        <Stack gap="sm">
          <Controller<ServerProps, "server.address">
            name="server.address"
            render={({ field, fieldState: { error } }) => (
              <TextInput {...field} label="Address" error={maybeError(error)} />
            )}
          />
          <Controller<ServerProps, "server.acctPort">
            name="server.acctPort"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                type="number"
                label="Accounting port"
                error={maybeError(error)}
              />
            )}
          />
          <Controller<ServerProps, "server.shared">
            name="server.shared"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                label="Shared secret"
                error={maybeError(error)}
              />
            )}
          />
          <Controller<ServerProps, "server.sourceIP">
            name="server.sourceIP"
            render={({ field, fieldState: { error } }) => (
              <Select
                {...field}
                data={options}
                label="Source IP address"
                error={maybeError(error)}
              />
            )}
          />
        </Stack>
      </Collapse>
    </Stack>
  );
};
