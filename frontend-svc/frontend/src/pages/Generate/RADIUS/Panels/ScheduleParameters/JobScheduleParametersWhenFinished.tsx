import { FC } from "react";
import {
  Group,
  InputLabel,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { useController } from "react-hook-form";

import { DisableableNumberInput } from "@/components/Inputs/DisableableNumberInput";
import styles from "@/components/Inputs/styles.module.scss";

import { RadiusForm } from "../../form";

export const JobScheduleParametersWhenFinished: FC = () => {
  const { field: timesField } = useController<
    RadiusForm,
    "scheduler.params.times"
  >({
    name: "scheduler.params.times",
    defaultValue: 1,
  });
  const { field: latencyField } = useController<
    RadiusForm,
    "scheduler.params.latency"
  >({
    name: "scheduler.params.latency",
    defaultValue: 0,
  });
  const { field: latencyUnitField } = useController<
    RadiusForm,
    "scheduler.params.latencyUnit"
  >({
    name: "scheduler.params.latencyUnit",
    defaultValue: "minutes",
  });

  return (
    <>
      <SimpleGrid cols={2} spacing="sm">
        <DisableableNumberInput
          {...timesField}
          label="Repeat times"
          disabled={
            timesField.value === -1 || (timesField.value as any) === "-1"
          }
          disabledValue="∞"
        />
        <Switch
          checked={
            timesField.value === -1 || (timesField.value as any) === "-1"
          }
          onChange={(e) => timesField.onChange(e.target.checked ? -1 : 1)}
          id="times-toggle"
          label="Repeat forever (until stopped)"
          display="flex"
          pt={rem(21)}
          style={{ alignItems: "center" }}
        />
      </SimpleGrid>
      <Stack gap={0}>
        <InputLabel htmlFor={latencyField.name}>
          Delay between repeats
        </InputLabel>
        <Group gap={0} align="end" className={styles.two_sectioned_input}>
          <TextInput
            {...latencyField}
            type="number"
            flex={1}
            classNames={{ input: styles.left_section }}
          />
          <Select
            {...latencyUnitField}
            data={[
              { value: "seconds", label: "Seconds" },
              { value: "minutes", label: "Minutes" },
              { value: "hours", label: "Hours" },
              { value: "days", label: "Days" },
            ]}
            classNames={{
              input: styles.right_section,
            }}
          />
        </Group>
      </Stack>
    </>
  );
};
