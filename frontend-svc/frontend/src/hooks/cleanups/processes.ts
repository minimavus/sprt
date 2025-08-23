import {
  type DefaultError,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import z from "zod";

import { useGetQuery } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { toast } from "@/utils/toasts";

export const JobSchema = z.object({
  id: z.string(),
  generator_id: z.string(),
  status: z.string(),
  progress: z.number(),
  user: z.string(),
});

export const ScheduledJobSchema = JobSchema.extend({
  schedule: z.string(),
});

export type Job = z.infer<typeof JobSchema>;
export type ScheduledJob = z.infer<typeof ScheduledJobSchema>;

const RunningJobsResponseSchema = z.object({
  jobs: z.array(JobSchema).nullable(),
});

export type RunningJobsResponse = z.infer<typeof RunningJobsResponseSchema>;

const ScheduledJobsResponseSchema = z.object({
  jobs: z.array(ScheduledJobSchema).nullable(),
});

export type ScheduledJobsResponse = z.infer<typeof ScheduledJobsResponseSchema>;

const getCleanupJobsKey = (): QueryKey => ["cleanup", "processes", "running"];

export function useCleanupJobs() {
  return useGetQuery({
    url: api.v2`cleanup/processes`,
    queryKey: getCleanupJobsKey(),
    schema: RunningJobsResponseSchema,
    mapper: (data) => data?.jobs || [],
  });
}

const StopJobRequestSchema = z.object({
  generator_id: z.string(),
  job_id: z.string(),
  user: z.string(),
});

export type StopJobRequest = z.infer<typeof StopJobRequestSchema>;

export function useStopJob() {
  const qc = useQueryClient();
  return useMutation<unknown, DefaultError, StopJobRequest>({
    mutationFn: async (cfg) => {
      return axios.delete(api.v2`cleanup/processes`, {
        data: cfg,
      });
    },
    onError: (error) => {
      log.error(error, "Failed to stop job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
      qc.invalidateQueries({ queryKey: getCleanupJobsKey() }).catch(log.error);
    },
    onSuccess: () => {
      toast.success({ title: "Updated", message: "Job stopped" });
      qc.invalidateQueries({ queryKey: getCleanupJobsKey() }).catch(log.error);
    },
  });
}

const getCleanupScheduledJobsKey = (): QueryKey => [
  "cleanup",
  "processes",
  "scheduled",
];

export function useCleanupScheduledJobs() {
  return useGetQuery({
    url: api.v2`cleanup/scheduled`,
    queryKey: getCleanupScheduledJobsKey(),
    schema: ScheduledJobsResponseSchema,
    mapper: (data) => data?.jobs || [],
  });
}

const DeleteScheduledJobRequestSchema = z.object({
  generator_id: z.string(),
  job_id: z.string(),
  user: z.string(),
});

export type DeleteScheduledJobRequest = z.infer<
  typeof DeleteScheduledJobRequestSchema
>;

export function useDeleteScheduledJob() {
  const qc = useQueryClient();
  return useMutation<unknown, DefaultError, DeleteScheduledJobRequest>({
    mutationFn: async (cfg) => {
      return axios.delete(api.v2`cleanup/scheduled`, {
        data: cfg,
      });
    },
    onError: (error) => {
      log.error(error, "Failed to delete scheduled job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
      qc.invalidateQueries({ queryKey: getCleanupScheduledJobsKey() }).catch(
        log.error,
      );
    },
    onSuccess: () => {
      toast.success({ title: "Updated", message: "Scheduled job deleted" });
      qc.invalidateQueries({ queryKey: getCleanupScheduledJobsKey() }).catch(
        log.error,
      );
    },
  });
}
