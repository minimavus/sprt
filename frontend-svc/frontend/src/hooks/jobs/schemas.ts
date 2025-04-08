import { z } from "zod";

import { zodTime } from "@/utils/zodTime";

export const allJobsUsersSchema = z.object({
  users: z.array(z.string()).nullable(),
});

export const jobSchema = z.object({
  id: z.string().nullish(),
  name: z.string().nullish(),
  percentage: z.coerce
    .number()
    .nullish()
    .transform((v) => v ?? 0),
  sessions: z.any(),
  attributes: z
    .object({
      count: z.coerce
        .number()
        .nullish()
        .transform((v) => v ?? 0),
      stats: z.string().nullish(),
      action: z.string().nullish(),
      failed: z.coerce.number().nullish(),
      server: z.string().nullish(),
      created: zodTime,
      finished: zodTime,
      protocol: z.string().nullish(),
      succeeded: z.coerce.number().nullish(),
    })
    .passthrough()
    .nullish(),
  owner: z.string().nullish(),
  pid: z.coerce.number().nullish(),
  cli: z.string().nullish(),
  line: z.string().nullish(),
});

export const jobsSchema = z.object({
  jobs: z.array(jobSchema),
  running: z.array(z.string()).nullish().default([]),
});

export type Job = z.infer<typeof jobSchema>;

export type Jobs = z.infer<typeof jobsSchema>;

export const jobStatsSchema = z.object({
  stats: z.object({
    averages: z.object({
      delays: z.array(z.number()),
      lengths: z.array(z.number()),
    }),
    delays: z.object({
      ids: z.array(z.string()),
      values: z.array(z.number()),
      new_style: z.array(
        z.object({
          avg: z.number().optional(),
          id: z.string(),
          name: z.string(),
          step: z.number(),
          value: z.number(),
        }),
      ),
    }),
    lengths: z.object({
      ids: z.array(z.string()),
      values: z.array(z.number()),
      new_style: z.array(
        z.object({
          avg: z.number().optional(),
          id: z.string(),
          name: z.string(),
          step: z.number(),
          value: z.number(),
        }),
      ),
    }),
    retransmits: z.object({
      ids: z.array(z.string().or(z.number())),
      values: z.array(z.number()),
      new_style: z.array(
        z.object({
          id: z.string().or(z.number()),
          name: z.string(),
          step: z.number(),
          value: z.number(),
        }),
      ),
    }),
    times: z.object({
      ids: z.array(z.string()),
      values: z.array(z.string()),
    }),
  }),
});

export type JobStats = z.infer<typeof jobStatsSchema>;
