import { TextInput, type TextInputProps } from "@mantine/core";
import { type Duration, formatDuration } from "date-fns";
import parseDuration from "parse-duration";
import { forwardRef, useState } from "react";

import { millisecondsToDuration } from "@/utils/zodDuration";

export const DurationEdit = forwardRef<
  HTMLInputElement,
  Omit<TextInputProps, "value" | "onChange"> & {
    value: Duration;
    onChange: (value: Duration) => void;
  }
>(({ value, onChange, onBlur, ...props }, ref) => {
  const [textValue, setTextValue] = useState(formatDuration(value));

  const handleBlur = (
    event: React.FocusEvent<HTMLInputElement, Element>,
  ): void => {
    const ms = parseDuration(textValue);
    if (typeof ms === "number") {
      const d = millisecondsToDuration(ms);
      onChange(d);
      setTextValue(formatDuration(d));
    }

    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <TextInput
      {...props}
      value={textValue}
      onChange={(e) => setTextValue(e.target.value)}
      onBlur={handleBlur}
      ref={ref}
    />
  );
});
