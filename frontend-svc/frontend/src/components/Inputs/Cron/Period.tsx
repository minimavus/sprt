import { rem, Select } from "@mantine/core";
import type { FC } from "react";
import type { PeriodProps, PeriodType } from "react-cron-headless";

export const PeriodField: FC<PeriodProps> = ({
  allowedPeriods,
  disabled,
  readOnly,
  setValue,
  value,
  allowClear,
  className,
}) => {
  return (
    <Select
      data={allowedPeriods}
      value={value}
      onChange={(value) => setValue(value as PeriodType)}
      allowDeselect={allowClear}
      className={className}
      readOnly={readOnly}
      disabled={disabled}
      label="Every"
      styles={{
        root: { alignItems: "center", gap: "var(--cron-fields-gap)" },
        input: { width: rem(100) },
      }}
    />
  );
};
