import {
  Button,
  Divider,
  Fieldset,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import cx from "classnames";
import type { FC, ReactNode, Ref } from "react";
import Cron, { type CronProps } from "react-cron-headless";

import styles from "./Cron.module.scss";
import { CustomSelect } from "./CustomSelect";
import { HoursField } from "./Hours";
import { MinutesField } from "./Minutes";
import { MonthDaysField } from "./MonthDays";
import { MonthsField } from "./Months";
import { PeriodField } from "./Period";
import { WeekDaysField } from "./WeekDays";

type MantineCronProps = Omit<CronProps, "components" | "setValue"> & {
  onChange: (...value: any[]) => void;
  legend?: ReactNode;
  onBlur?: () => void;
  ref?: Ref<HTMLInputElement>;
  name?: string;
  error?: string;
};

const MantineCron: FC<MantineCronProps> = ({
  onChange,
  className,
  allowedPeriods = ["minute", "hour", "day", "week", "month"],
  legend,
  ref,
  name,
  error,
  ...props
}) => {
  return (
    <Fieldset legend={legend} className={styles.fieldset}>
      <Stack gap="xs">
        <Cron
          components={{
            HoursField,
            PeriodField,
            MinutesField,
            MonthDaysField,
            MonthsField,
            WeekDaysField,
            Select: CustomSelect,
          }}
          clearButton={false}
          setValue={onChange}
          className={cx(className, styles.cron)}
          allowedPeriods={allowedPeriods}
          {...props}
        />
        <Divider label="OR" variant="dashed" />
        <TextInput
          label="Cron Expression"
          placeholder="* * * * *"
          value={props.value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onBlur={props.onBlur}
          ref={ref}
          name={name}
          error={error}
        />
        {Array.isArray(props.shortcuts) && props.shortcuts.length > 0 ? (
          <Group gap="var(--cron-fields-gap)">
            <Text span>Shortcuts:</Text>
            <Button.Group>
              {props.shortcuts.map((shortcut) => (
                <Button
                  type="button"
                  key={shortcut}
                  onClick={() => {
                    onChange(shortcut);
                    props.onBlur?.();
                  }}
                  size="compact-sm"
                  variant="subtle"
                >
                  {shortcut}
                </Button>
              ))}
            </Button.Group>
          </Group>
        ) : null}
      </Stack>
    </Fieldset>
  );
};

export { MantineCron as Cron };
