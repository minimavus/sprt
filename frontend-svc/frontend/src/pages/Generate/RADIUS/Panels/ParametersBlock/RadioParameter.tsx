import { Radio, Stack } from "@mantine/core";
import { useController } from "react-hook-form";

import { getErrorMessage } from "@/utils/errors";

import { useFieldState } from "../../formStateContext";
import type { ParameterComponent } from "./types";
import { useWatchActions } from "./useWatchActions";
import { withPrefix } from "./utils";

export const RadioParameter: ParameterComponent<"radio"> = ({ p, prefix }) => {
  const name = withPrefix(prefix, p.name);
  const {
    field,
    fieldState: { error },
  } = useController({ name, defaultValue: p.value });

  useWatchActions({
    watch: p.watch,
    prefix,
  });

  const state = useFieldState(name);

  if (state === "hidden") {
    return null;
  }

  return (
    <Radio.Group {...field} error={getErrorMessage(error)} label={p.label}>
      <Stack gap="xs" mt="xs">
        {p.options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={state === "disabled"}
          />
        ))}
      </Stack>
    </Radio.Group>
  );
};
