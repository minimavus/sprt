import { Group, Text } from "@mantine/core";
import type { FC } from "react";
import type { MinutesProps } from "react-cron-headless";

import { UNIT_MINUTES } from "./constants";

export const MinutesField: FC<MinutesProps> = ({
  locale,
  period,
  SelectComponent,
  ...props
}) => {
  return (
    <Group gap="var(--cron-fields-gap)">
      {period === "hour"
        ? locale.prefixMinutesForHourPeriod !== "" && (
            <Text span>{locale.prefixMinutesForHourPeriod}</Text>
          )
        : locale.prefixMinutes !== "" && (
            <Text span>{locale.prefixMinutes}</Text>
          )}

      <SelectComponent
        grid
        placeholder={
          period === "hour"
            ? locale.emptyMinutesForHourPeriod
            : locale.emptyMinutes
        }
        period={period}
        unit={UNIT_MINUTES}
        locale={locale}
        {...props}
      />

      {period === "hour" && locale.suffixMinutesForHourPeriod !== "" && (
        <Text span>{locale.suffixMinutesForHourPeriod}</Text>
      )}
    </Group>
  );
};
