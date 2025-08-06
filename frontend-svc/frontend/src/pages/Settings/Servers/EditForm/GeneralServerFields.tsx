import { Stack, TextInput } from "@mantine/core";
import type { FC } from "react";
import { Controller } from "react-hook-form";

import type { ServerSettings } from "@/hooks/settings/servers";
import { getErrorMessage } from "@/utils/errors";

export const GeneralServerFields: FC = () => {
  return (
    <Stack gap="sm">
      <Controller<ServerSettings, "attributes.friendly_name">
        name="attributes.friendly_name"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="Friendly name"
          />
        )}
      />
      <Controller<ServerSettings, "address">
        name="address"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="IPv4 address"
          />
        )}
      />

      <Controller<ServerSettings, "attributes.v6_address">
        name="attributes.v6_address"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="IPv6 address"
          />
        )}
      />

      <Controller<ServerSettings, "attributes.dns">
        name="attributes.dns"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="DNS server (IP address)"
          />
        )}
      />

      <Controller<ServerSettings, "group">
        name="group"
        render={({ field, fieldState: { error } }) => (
          <TextInput {...field} error={getErrorMessage(error)} label="Group" />
        )}
      />
    </Stack>
  );
};
