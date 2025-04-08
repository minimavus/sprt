import { FC } from "react";
import { NumberInput, NumberInputProps, TextInput } from "@mantine/core";

interface DisableableNumberInputProps extends NumberInputProps {
  disabledValue?: string;
}

export const DisableableNumberInput: FC<DisableableNumberInputProps> = ({
  disabledValue,
  disabled,
  ...props
}) => {
  if (disabled && disabledValue) {
    return <TextInput {...(props as any)} value={disabledValue} disabled />;
  }
  return <NumberInput {...props} disabled={disabled} />;
};
