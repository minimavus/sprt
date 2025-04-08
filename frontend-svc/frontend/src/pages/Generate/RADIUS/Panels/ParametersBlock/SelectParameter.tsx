import { MultiSelect, Select } from "@mantine/core";
import { useController } from "react-hook-form";

import { getErrorMessage } from "@/utils/errors";

import { useFieldState } from "../../formStateContext";
import { ParameterComponent } from "./types";
import { useWatchActions } from "./useWatchActions";
import { withPrefix } from "./utils";

export const SelectParameter: ParameterComponent<"select"> = ({
  p,
  prefix,
}) => {
  const name = withPrefix(prefix, p.name);
  const {
    field: { value, onChange, ...field },
    fieldState: { error },
  } = useController<{ [x: typeof name]: string[] | string }, typeof name>({
    name,
    defaultValue: p.value,
  });

  useWatchActions({
    watch: p.watch,
    prefix,
  });

  const state = useFieldState(name);

  if (state === "hidden") {
    return null;
  }

  if (!p.multi) {
    return (
      <Select
        {...field}
        value={(value as string) || ""}
        onChange={(value) => onChange(value)}
        data={p.options}
        label={p.label}
        error={getErrorMessage(error)}
        clearable={false}
        allowDeselect={false}
      />
    );
  }

  return (
    <MultiSelect
      {...field}
      value={value as string[]}
      onChange={(value) => onChange(value)}
      data={p.options}
      label={p.label}
      error={getErrorMessage(error)}
    />
  );
};
