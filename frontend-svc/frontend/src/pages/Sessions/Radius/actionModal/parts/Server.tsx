import { type FC } from "react";
import { Collapse, Select, Stack, Switch, TextInput } from "@mantine/core";
import { Controller, useController } from "react-hook-form";

import { useNADSourcesCombined } from "@/hooks/generate/useNADSources";
import { useQueryUser } from "@/hooks/useQueryUser";
import { maybeError } from "@/utils/errors";

import { FormDataFlags, ServerProps } from "../types";

export const Server: FC = () => {
  const [u] = useQueryUser();
  const useDifferentServer = useController<
    FormDataFlags,
    "flags.differentServer"
  >({
    name: "flags.differentServer",
  });

  const { data: options } = useNADSourcesCombined(u);

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
