import { NumberInput } from "@mantine/core";
import { useController } from "react-hook-form";

import { InputHelp } from "@/components/Inputs/InputHelp";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import { useFieldState } from "../../formStateContext";
import { useIsInline } from "./blockContext";
import { ParameterComponent } from "./types";
import { withPrefix } from "./utils";

export const NumberInputParameter: ParameterComponent<"number_input"> = ({
  p,
  prefix,
}) => {
  const name = withPrefix(prefix, p.name);
  const {
    field,
    fieldState: { error },
  } = useController({ name, defaultValue: p.value });

  const state = useFieldState(name);
  const inline = useIsInline();

  if (state === "hidden") {
    return null;
  }

  if (p.buttons) {
    console.warn("Buttons are not supported yet for NumberInput", p.buttons);
  }

  return (
    <NumberInput
      {...field}
      error={getErrorMessage(error)}
      readOnly={p.readonly}
      disabled={p.readonly || state === "disabled"}
      description={p.description}
      classNames={{
        root: inline ? styles.inline : styles.compact,
        wrapper: inline ? styles.wrapper : undefined,
      }}
      label={
        p.hint ? (
          <>
            {p.label}
            <InputHelp help={p.hint} />
          </>
        ) : (
          p.label
        )
      }
    />
  );
};
