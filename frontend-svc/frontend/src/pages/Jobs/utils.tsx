import type { ProgressProps } from "@mantine/core";

import type { Job } from "@/hooks/jobs";

type jobStatusProps = Pick<ProgressProps, "color" | "animated">;

export const getJobStatus = (job: Job, isRunning: boolean): jobStatusProps => {
  if (job.percentage === 100) {
    return { color: "green" };
  }

  if (!job.pid) {
    return { color: "red" };
  }

  return { color: isRunning ? "blue" : "orange", animated: !isRunning };
};

export const getJobLabel = (job: Job, isRunning: boolean) => {
  if (job.percentage === 100) {
    return "Completed";
  }

  if (!job.pid) {
    return "Failed";
  }

  return isRunning ? "Running" : "Failed";
};
