import type { QueryKey } from "@tanstack/react-query";
import z from "zod";
import { api } from "@/utils/apiCompose";
import { useGetQuery } from "../useGetQuery";

export const JobSchema = z.object({
  id: z.string(),
  generator_id: z.string(),
  status: z.string(),
  progress: z.number(),
  user: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

const RunningJobsResponseSchema = z.object({
  jobs: z.array(JobSchema).nullable(),
});

export type RunningJobsResponse = z.infer<typeof RunningJobsResponseSchema>;

const getCleanupJobsKey = (): QueryKey => ["cleanup", "processes"];

export function useCleanupJobs() {
  return useGetQuery({
    url: api.v2`cleanup/processes`,
    queryKey: getCleanupJobsKey(),
    schema: RunningJobsResponseSchema,
    mapper: (data) => data?.jobs || [],
  });
}
