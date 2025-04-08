import { FC } from "react";
import { Group, Text } from "@mantine/core";
import { HoursProps } from "react-cron-headless";

import { UNIT_HOURS } from "./constants";

export const HoursField: FC<HoursProps> = ({ SelectComponent, ...props }) => {
  return (
    <Group gap="var(--cron-fields-gap)">
      {props.locale.prefixHours !== "" && (
        <Text span>{props.locale.prefixHours}</Text>
      )}

      <SelectComponent
        placeholder={props.locale.emptyHours}
        unit={UNIT_HOURS}
        grid
        {...props}
      />
    </Group>
  );
};
