import { useRef, useState } from "react";
import { TextInput } from "@mantine/core";
import { useMergedRef } from "@mantine/hooks";
import { useController } from "react-hook-form";

import { InputHelp } from "@/components/Inputs/InputHelp";
import {
  InputSideButtons,
  InputSideButtonsContext,
} from "@/components/Inputs/InputSideButtons";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import { useFieldState } from "../../formStateContext";
import { useIsInline } from "./blockContext";
import { ParameterComponent } from "./types";
import { withPrefix } from "./utils";

export const TextInputParameter: ParameterComponent<"text_input"> = ({
  p,
  prefix,
}) => {
  const name = withPrefix(prefix, p.name);
  const {
    field: { ref, ...field },
    fieldState: { error },
  } = useController({ name, defaultValue: p.value });

  const state = useFieldState(name);
  const inline = useIsInline();
  const [buttonsWidth, setButtonsWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const merged = useMergedRef(inputRef, ref);

  if (state === "hidden") {
    return null;
  }

  return (
    <InputSideButtonsContext value={{ setButtonsWidth }}>
      <TextInput
        {...field}
        error={getErrorMessage(error)}
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
        ref={merged}
        readOnly={p.readonly}
        disabled={p.readonly || state === "disabled"}
        description={p.description}
        classNames={{
          root: inline ? styles.inline : styles.compact,
          wrapper: inline ? styles.wrapper : undefined,
        }}
        rightSectionWidth={buttonsWidth || undefined}
        rightSection={
          p.buttons ? (
            <InputSideButtons
              buttons={p.buttons}
              onChange={field.onChange}
              inputRef={inputRef}
            />
          ) : undefined
        }
      />
    </InputSideButtonsContext>
  );
};
