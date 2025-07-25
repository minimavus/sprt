import type { FC } from "react";
import { useController } from "react-hook-form";

import { Cron } from "@/components/Inputs/Cron";
import { getErrorMessage } from "@/utils/errors";

import type { RadiusForm } from "../../form";

export const JobScheduleParametersSchedule: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController<RadiusForm, "scheduler.params.cron">({
    name: "scheduler.params.cron",
    defaultValue: "0 0 * * *",
  });

  return (
    <Cron
      legend="Schedule"
      leadingZero
      {...field}
      error={getErrorMessage(error)}
      shortcuts={["@hourly", "@daily", "@weekly", "@monthly"]}
    />
  );
};
