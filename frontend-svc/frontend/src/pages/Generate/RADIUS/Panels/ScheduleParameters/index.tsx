import { type FC } from "react";
import {
  InputLabel,
  SegmentedControl,
  SegmentedControlItem,
  Stack,
} from "@mantine/core";
import { useController } from "react-hook-form";

import { Info } from "@/components/Alerts";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";

import { RadiusForm } from "../../form";
import { InterimUpdatesScheduleParameters } from "./InterimUpdatesScheduleParameters";
import { JobScheduleParametersSchedule } from "./JobScheduleParametersSchedule";
import { JobScheduleParametersWhenFinished } from "./JobScheduleParametersWhenFinished";

const HowToScheduleJobOptions: SegmentedControlItem[] = [
  { value: "when-finished", label: "Repeat when finished" },
  { value: "schedule", label: "Per schedule" },
];

const JobScheduleParameters: FC = () => {
  const {
    field: { value, onChange, ...field },
  } = useController<RadiusForm, "scheduler.params.how">({
    name: "scheduler.params.how",
    defaultValue: "when-finished",
  });

  return (
    <>
      <LabeledSegmentedControl
        label="How to schedule the job"
        {...field}
        data={HowToScheduleJobOptions}
        value={value}
        onChange={onChange}
      />
      {value === "when-finished" ? (
        <JobScheduleParametersWhenFinished />
      ) : value === "schedule" ? (
        <JobScheduleParametersSchedule />
      ) : null}
    </>
  );
};

const ScheduleOptions: SegmentedControlItem[] = [
  { value: "nothing", label: "Nothing" },
  { value: "job", label: "Job itself" },
  { value: "interim-updates", label: "Interim updates" },
];

export const ScheduleParameters: FC = () => {
  const {
    field: { value, onChange, ...field },
  } = useController<RadiusForm, "scheduler.what">({
    name: "scheduler.what",
  });

  return (
    <>
      <LabeledSegmentedControl
        label="What to schedule"
        {...field}
        data={ScheduleOptions}
        value={value}
        onChange={onChange}
      />
      {value === "job" ? (
        <JobScheduleParameters />
      ) : value === "interim-updates" ? (
        <InterimUpdatesScheduleParameters />
      ) : null}

      <Info>Schedule will be added after the job finished</Info>
    </>
  );
};
