import { FC } from "react";
import { Group, Text } from "@mantine/core";
import { MonthsProps } from "react-cron-headless";

import { UNIT_MONTHS } from "./constants";

export const MonthsField: FC<MonthsProps> = ({ SelectComponent, ...props }) => {
  const optionsList = props.locale.months;

  return (
    <Group gap="var(--cron-fields-gap)">
      {props.locale.prefixMonths !== "" && (
        <Text span>{props.locale.prefixMonths}</Text>
      )}

      <SelectComponent
        placeholder={props.locale.emptyMonths}
        optionsList={optionsList}
        grid={false}
        unit={{
          ...UNIT_MONTHS,
          // Allow translation of alternative labels when using "humanizeLabels"
          // Issue #3
          alt: props.locale.altMonths,
        }}
        {...props}
      />
    </Group>
  );
};
