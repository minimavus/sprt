import {
  InputLabel,
  SegmentedControl,
  type SegmentedControlProps,
  Stack,
} from "@mantine/core";
import { type FC, type ReactNode, useCallback, useId } from "react";
import { useFormContext } from "react-hook-form";

interface LabeledSegmentedControlProps extends SegmentedControlProps {
  label?: ReactNode;
  clearRelatedErrors?: boolean | string;
}

export const LabeledSegmentedControl: FC<LabeledSegmentedControlProps> = ({
  label,
  clearRelatedErrors = false,
  onChange: fieldOnChange,
  name,
  ...props
}) => {
  const ctx = useFormContext();

  const onChange = useCallback(
    (v: string) => {
      if (ctx?.control && clearRelatedErrors && name) {
        const namesToClear = [];
        const startsWith =
          typeof clearRelatedErrors === "string" ? clearRelatedErrors : name;
        for (const n of ctx.control._names.mount) {
          if (n.startsWith(startsWith)) {
            namesToClear.push(n);
          }
        }
        if (namesToClear.length) {
          ctx.clearErrors(namesToClear);
        }
      }

      fieldOnChange?.(v);
    },
    [name, fieldOnChange, ctx],
  );
  const id = useId();

  return (
    <Stack gap={0}>
      <InputLabel htmlFor={props.id ?? id}>{label}</InputLabel>
      <div>
        <SegmentedControl
          id={props.id ?? id}
          {...props}
          name={name}
          onChange={onChange}
        />
      </div>
    </Stack>
  );
};
