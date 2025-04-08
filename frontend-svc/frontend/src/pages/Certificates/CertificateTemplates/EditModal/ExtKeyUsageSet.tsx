import { type FC } from "react";
import { Checkbox, Collapse, SimpleGrid, Switch } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import type { FormValues } from "./types";

export const ExtKeyUsageSet: FC = () => {
  const [ekU] = useWatch<FormValues, ["withExtKeyUsage"]>({
    name: ["withExtKeyUsage"],
  });

  return (
    <>
      <Controller<FormValues, "withExtKeyUsage">
        name="withExtKeyUsage"
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={field.onChange}
            label="Extended Key Usage"
          />
        )}
      />
      <Collapse in={ekU}>
        <SimpleGrid cols={2} spacing="xs" ml="md" mb="sm">
          <Controller<FormValues, "content.ext_key_usage.clientAuth">
            name="content.ext_key_usage.clientAuth"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Client Auth" />
            )}
          />
          <Controller<FormValues, "content.ext_key_usage.serverAuth">
            name="content.ext_key_usage.serverAuth"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Server Auth" />
            )}
          />
          <Controller<FormValues, "content.ext_key_usage.codeSigning">
            name="content.ext_key_usage.codeSigning"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Code Signing" />
            )}
          />
          <Controller<FormValues, "content.ext_key_usage.timeStamping">
            name="content.ext_key_usage.timeStamping"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Time Stamping" />
            )}
          />
          <Controller<FormValues, "content.ext_key_usage.emailProtection">
            name="content.ext_key_usage.emailProtection"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Email Protection" />
            )}
          />
        </SimpleGrid>
      </Collapse>
    </>
  );
};
