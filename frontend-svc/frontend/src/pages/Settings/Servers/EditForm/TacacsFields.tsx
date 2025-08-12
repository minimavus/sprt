import { Pill, PillsInput, Stack, Switch, TextInput } from "@mantine/core";
import type { FC } from "react";
import { Controller, useController } from "react-hook-form";
import { z } from "zod";

import type { ServerSettings } from "@/hooks/settings/servers";
import { maybeError } from "@/utils/errors";
import { toast } from "@/utils/toasts";

const numberSchema = z.coerce.number().min(1).max(65535);

const GeneralTacacsFields: FC = () => {
  const { field: ports, fieldState: portsState } = useController<
    ServerSettings,
    "attributes.tac.ports"
  >({ name: "attributes.tac.ports" });

  return (
    <>
      <PillsInput label="Ports" error={maybeError(portsState.error)}>
        <Pill.Group>
          {Array.isArray(ports.value)
            ? ports.value.map((p) => (
                <Pill
                  key={p}
                  onRemove={() =>
                    void ports.onChange(ports.value?.filter((v) => v !== p))
                  }
                  withRemoveButton
                >
                  {p}
                </Pill>
              ))
            : null}
          {Array.isArray(ports.value) && ports.value.length >= 4 ? null : (
            <PillsInput.Field
              inputMode="numeric"
              onKeyDown={(v) => {
                if (v.key !== "Enter") return;

                v.preventDefault();

                const n = numberSchema.safeParse(v.currentTarget.value);
                if (!n.success) {
                  toast.error({
                    title: "Incorrect value",
                    message: n.error.message,
                  });
                  return;
                }
                if (ports.value?.includes(n.data)) {
                  toast.error({
                    title: "Incorrect value",
                    message: "Port already specified",
                  });
                  return;
                }

                ports.onChange([...(ports.value || []), n.data]);
                v.currentTarget.value = "";
              }}
              placeholder="Add port"
            />
          )}
        </Pill.Group>
      </PillsInput>
      <Controller<ServerSettings, "attributes.tac.shared">
        name="attributes.tac.shared"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            label="Shared secret"
            error={maybeError(error)}
            {...field}
          />
        )}
      />
    </>
  );
};

export const TacacsFields: FC = () => {
  const {
    field: { value: checked, ...toggleProps },
  } = useController<ServerSettings, "attributes.tacacs">({
    name: "attributes.tacacs",
  });

  return (
    <Stack gap="sm">
      <Switch {...toggleProps} checked={checked} label="Enabled" />
      {checked ? <GeneralTacacsFields /> : null}
    </Stack>
  );
};
