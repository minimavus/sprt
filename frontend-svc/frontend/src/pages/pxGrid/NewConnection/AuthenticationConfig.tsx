import { FC } from "react";
import { Stack } from "@mantine/core";
import { Controller, useWatch } from "react-hook-form";

import { Info } from "@/components/Alerts";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";

import { NewConnectionFields } from "./form";

export const AuthenticationConfig: FC = () => {
  const typeSelected = useWatch<NewConnectionFields, "auth.type">({
    name: "auth.type",
  });

  return (
    <Stack gap="sm">
      <Controller<NewConnectionFields, "auth.type">
        name="auth.type"
        render={({ field: { onChange, ...field } }) => (
          <LabeledSegmentedControl
            label="Authentication type"
            onChange={onChange}
            data={[
              {
                label: "Password",
                value: "password",
              },
              {
                label: "Certificate",
                value: "certificate",
              },
            ]}
            {...field}
          />
        )}
      />

      {typeSelected === "password" ? (
        <Info>
          Client name will be used as username. Password will be provided by
          ISE.
        </Info>
      ) : (
        <div>Certificate</div>
      )}
    </Stack>
  );
};
