import { type FC } from "react";
import { Checkbox, Collapse, SimpleGrid, Switch } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import type { FormValues } from "./types";

export const KeyUsageSet: FC = () => {
  const [kU] = useWatch<FormValues, ["withKeyUsage"]>({
    name: ["withKeyUsage"],
  });

  return (
    <>
      <Controller<FormValues, "withKeyUsage">
        name="withKeyUsage"
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={field.onChange}
            label="Key Usage"
          />
        )}
      />
      <Collapse in={kU}>
        <SimpleGrid cols={2} spacing="xs" ml="md" mb="sm">
          <Controller<FormValues, "content.key_usage.cRLSign">
            name="content.key_usage.cRLSign"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="CRL Sign" />
            )}
          />
          <Controller<FormValues, "content.key_usage.keyCertSign">
            name="content.key_usage.keyCertSign"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Key Cert Sign" />
            )}
          />
          <Controller<FormValues, "content.key_usage.decipherOnly">
            name="content.key_usage.decipherOnly"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Decipher Only" />
            )}
          />
          <Controller<FormValues, "content.key_usage.encipherOnly">
            name="content.key_usage.encipherOnly"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Encipher Only" />
            )}
          />
          <Controller<FormValues, "content.key_usage.keyAgreement">
            name="content.key_usage.keyAgreement"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Key Agreement" />
            )}
          />
          <Controller<FormValues, "content.key_usage.nonRepudiation">
            name="content.key_usage.nonRepudiation"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Non Repudiation" />
            )}
          />
          <Controller<FormValues, "content.key_usage.keyEncipherment">
            name="content.key_usage.keyEncipherment"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Key Encipherment" />
            )}
          />
          <Controller<FormValues, "content.key_usage.dataEncipherment">
            name="content.key_usage.dataEncipherment"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Data Encipherment" />
            )}
          />
          <Controller<FormValues, "content.key_usage.digitalSignature">
            name="content.key_usage.digitalSignature"
            render={({ field: { value, ...field } }) => (
              <Checkbox checked={value} {...field} label="Digital Signature" />
            )}
          />
        </SimpleGrid>
      </Collapse>
    </>
  );
};
