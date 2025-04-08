import { FC, useMemo } from "react";
import { Group, Text } from "@mantine/core";
import { WeekDaysProps } from "react-cron-headless";

import { UNIT_WEEK_DAYS } from "./constants";

export const WeekDaysField: FC<WeekDaysProps> = ({
  SelectComponent,
  monthDays,
  ...props
}) => {
  const optionsList = props.locale.weekDays;
  const noMonthDays =
    props.period === "week" || !monthDays || monthDays.length === 0;

  const placeholder = useMemo(() => {
    if (noMonthDays) {
      return props.locale.emptyWeekDays;
    }

    return props.locale.emptyWeekDaysShort;
  }, [noMonthDays, props.locale]);

  const displayWeekDays =
    props.period === "week" ||
    !props.readOnly ||
    (props.value && props.value.length > 0) ||
    ((!props.value || props.value.length === 0) &&
      (!monthDays || monthDays.length === 0));

  const monthDaysIsDisplayed =
    !props.readOnly ||
    (monthDays && monthDays.length > 0) ||
    ((!monthDays || monthDays.length === 0) &&
      (!props.value || props.value.length === 0));

  return displayWeekDays ? (
    <Group gap="var(--cron-fields-gap)">
      {props.locale.prefixWeekDays !== "" &&
        (props.period === "week" || !monthDaysIsDisplayed) && (
          <Text span>{props.locale.prefixWeekDays}</Text>
        )}

      {props.locale.prefixWeekDaysForMonthAndYearPeriod !== "" &&
        props.period !== "week" &&
        monthDaysIsDisplayed && (
          <Text span>{props.locale.prefixWeekDaysForMonthAndYearPeriod}</Text>
        )}

      <SelectComponent
        placeholder={placeholder}
        optionsList={optionsList}
        grid={false}
        unit={{
          ...UNIT_WEEK_DAYS,
          // Allow translation of alternative labels when using "humanizeLabels"
          // Issue #3
          alt: props.locale.altWeekDays,
        }}
        {...props}
      />
    </Group>
  ) : null;
};
