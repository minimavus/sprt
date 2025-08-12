import { Group, Text } from "@mantine/core";
import { type FC, useMemo } from "react";
import type { MonthDaysProps } from "react-cron-headless";

import { UNIT_MONTH_DAYS } from "./constants";

export const MonthDaysField: FC<MonthDaysProps> = ({
  SelectComponent,
  weekDays,
  ...props
}) => {
  const noWeekDays = !weekDays || weekDays.length === 0;
  const placeholder = useMemo(() => {
    if (noWeekDays) {
      return props.locale.emptyMonthDays;
    }

    return props.locale.emptyMonthDaysShort;
  }, [noWeekDays, props.locale]);
  const displayMonthDays =
    !props.readOnly ||
    (props.value && props.value.length > 0) ||
    ((!props.value || props.value.length === 0) &&
      (!weekDays || weekDays.length === 0));

  return displayMonthDays ? (
    <Group gap="var(--cron-fields-gap)">
      {props.locale.prefixMonthDays !== "" && (
        <Text span>{props.locale.prefixMonthDays}</Text>
      )}

      <SelectComponent
        placeholder={placeholder}
        unit={UNIT_MONTH_DAYS}
        grid
        {...props}
      />
    </Group>
  ) : null;
};
