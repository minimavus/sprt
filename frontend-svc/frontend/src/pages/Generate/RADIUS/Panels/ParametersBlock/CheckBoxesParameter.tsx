import { Checkbox, Group, InputLabel, Stack } from "@mantine/core";
import { Controller } from "react-hook-form";

import { useFieldState } from "../../formStateContext";
import type { ParameterComponent } from "./types";
import { withPrefix } from "./utils";

export const CheckBoxesParameter: ParameterComponent<"checkboxes"> = ({
  p,
  prefix,
  ParamsMapped: _,
  ...props
}) => {
  const ourPrefix = withPrefix(prefix, p.name);

  const state = useFieldState(ourPrefix);

  if (state === "hidden") {
    return null;
  }

  return (
    <Stack gap={0} {...props}>
      <InputLabel>{p.label}</InputLabel>
      <Group gap="xs">
        {p.options.map((option) => (
          <Controller
            key={option.name}
            name={withPrefix(ourPrefix, option.name)}
            defaultValue={option.value}
            render={({ field: { value, onChange, ...field } }) => (
              <Checkbox
                {...field}
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                label={option.label}
              />
            )}
          />
        ))}
      </Group>
    </Stack>
  );
};
