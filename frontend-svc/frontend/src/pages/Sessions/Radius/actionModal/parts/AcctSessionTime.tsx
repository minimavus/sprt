import { type FC } from "react";
import { Group, NumberInput, Select } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import { getErrorMessage } from "@/utils/errors";

import { DropFormData } from "../Drop";
import { SessionTimeVariants } from "../types";

export const AcctSessionTime: FC = () => {
  const selectedVariant = useWatch<
    DropFormData,
    "attributes.acctSessionTimeVariant"
  >({
    name: "attributes.acctSessionTimeVariant",
  });

  return (
    <Group gap="xs">
      <Controller<DropFormData, "attributes.acctSessionTimeVariant">
        name="attributes.acctSessionTimeVariant"
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            style={{ maxWidth: "unset", flex: 1 }}
            data={SessionTimeVariants}
            label="Acct-Session-Time"
            error={getErrorMessage(error)}
            flex={1}
          />
        )}
      />
      {selectedVariant === "custom" ? (
        <Controller<DropFormData, "attributes.acctSessionTime">
          name="attributes.acctSessionTime"
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              {...field}
              label="Seconds"
              error={getErrorMessage(error)}
              flex={1}
            />
          )}
        />
      ) : null}
    </Group>
  );
};
