import {
  Button,
  Group,
  InputError,
  noop,
  Stack,
  TextInput,
} from "@mantine/core";
import type { FC, ReactNode } from "react";
import type { FieldError } from "react-hook-form";

import styles from "./DrawerSelect.module.scss";

type SelectInputProps = {
  label: ReactNode;
  inputLabel: ReactNode | undefined;
  inputRef: React.Ref<HTMLInputElement> | undefined;
  singular: string | undefined;
  plural: string | undefined;
  loading: boolean | undefined;
  disabled: boolean | undefined;
  error: Error | FieldError | undefined;
  selectedSize: number;
  onSelect: () => void;
  displayValue?: string;
};

const buildLabel = (size: number, singular?: string, plural?: string) => {
  if (size === 0) {
    return plural ? `No ${plural} selected` : "Nothing selected";
  }

  if (size === 1) {
    return `${size} ${singular ? `${singular} ` : ""}selected`;
  }

  return `${size} ${plural ? `${plural} ` : ""}selected`;
};

export const SelectInput: FC<SelectInputProps> = ({
  selectedSize,
  singular,
  plural,
  inputLabel,
  inputRef,
  disabled,
  label,
  error: errorProp,
  loading,
  onSelect,
  displayValue,
}) => {
  return (
    <Stack gap={0}>
      <Group align="flex-end" gap={0} className={styles["drawer-select-root"]}>
        <TextInput
          flex={1}
          value={displayValue ?? buildLabel(selectedSize, singular, plural)}
          onChange={noop}
          readOnly={true}
          styles={{
            input: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
          label={inputLabel}
          disabled={disabled}
          ref={inputRef}
        />
        <Button
          variant="default"
          onClick={onSelect}
          className={styles["select-button"]}
          disabled={disabled}
          loading={loading}
        >
          {label}
        </Button>
      </Group>
      {errorProp ? <InputError>{errorProp.message}</InputError> : null}
    </Stack>
  );
};
