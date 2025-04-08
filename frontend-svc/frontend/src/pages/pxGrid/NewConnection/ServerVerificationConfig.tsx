import { FC } from "react";
import { Checkbox, Stack } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import { Info } from "@/components/Alerts";

import { NewConnectionFields } from "./form";

export const ServerVerificationConfig: FC = () => {
  const verify = useWatch<NewConnectionFields, "serverVerify.verify">({
    name: "serverVerify.verify",
  });

  return (
    <Stack gap="sm">
      <Controller<NewConnectionFields, "serverVerify.verify">
        name="serverVerify.verify"
        render={({ field: { value, onChange, ...field } }) => (
          <Checkbox
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            label="Verify server certificate"
          />
        )}
      />
      {verify ? (
        <div>Verify</div>
      ) : (
        <Info>Server verification is disabled.</Info>
      )}
    </Stack>
  );
};
