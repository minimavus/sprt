import { Checkbox } from "@mantine/core";
import { useController } from "react-hook-form";

import { useFieldState } from "../../formStateContext";
import { ParameterComponent } from "./types";
import { useWatchActions } from "./useWatchActions";
import { withPrefix } from "./utils";

export const CheckBoxParameter: ParameterComponent<"checkbox"> = ({
  p,
  prefix,
  ParamsMapped: _,
  ...props
}) => {
  const name = withPrefix(prefix, p.name);

  useWatchActions({ watch: p.watch, prefix });

  const {
    field: { value, ...field },
  } = useController({ name, defaultValue: p.value });

  const state = useFieldState(name);

  if (state === "hidden") {
    return null;
  }

  return (
    <Checkbox
      {...field}
      checked={Boolean(value)}
      label={p.label}
      disabled={state === "disabled"}
      {...props}
    />
  );
};
