import { Textarea } from "@mantine/core";
import { useController } from "react-hook-form";

import { getErrorMessage } from "@/utils/errors";

import { ListControls } from "../../common/ListControls";
import { useFieldState } from "../../formStateContext";
import type { ParameterComponent } from "./types";
import { withPrefix } from "./utils";

export const ListParameter: ParameterComponent<"list"> = ({
  p,
  prefix,
  ParamsMapped: _,
  ...props
}) => {
  const name = withPrefix(prefix, p.name);
  const {
    field,
    fieldState: { error },
  } = useController({ name, defaultValue: p.value });

  const state = useFieldState(name);

  if (state === "hidden") {
    return null;
  }

  return (
    <Textarea
      {...field}
      error={getErrorMessage(error)}
      label={p.label}
      description={p.hint}
      rightSectionWidth="var(--mantine-spacing-sm)"
      rightSection={
        p.allow_from_file ? (
          <ListControls
            onChange={field.onChange}
            fromFile
            fromBulk={false}
            clean
          />
        ) : undefined
      }
      styles={{
        section: {
          alignItems: "flex-end",
          justifyContent: "flex-end",
        },
      }}
      autosize
      minRows={3}
      maxRows={10}
      disabled={state === "disabled"}
      {...props}
    />
  );
};
