import {
  type DefaultError,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { toast } from "@/utils/toasts";
import { zodCron } from "@/utils/zodCron";
import {
  durationToMilliseconds,
  isZeroDuration,
  zodDuration,
} from "@/utils/zodDuration";
import { zodTime } from "@/utils/zodTime";

import { useGetQuery } from "./useGetQuery";
import type { Protos } from "./zodProto";

const getOrphanedFlowsKey = (full?: boolean): QueryKey =>
  full ? ["cleanup", "flows"] : ["cleanup", "flows", "stats"];

const OrphanedFlowsSchema = z.object({
  total: z.number(),
  flows: z.array(z.number()).nullish(),
});

export type OrphanedFlows = z.infer<typeof OrphanedFlowsSchema>;

export const useOrphanedFlows = (full?: boolean) => {
  return useGetQuery({
    url: api.v2`cleanup/flows`,
    queryKey: getOrphanedFlowsKey(full),
    schema: OrphanedFlowsSchema,
    params: {
      full,
    },
  });
};

export function useOrphanFlowsDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ total: number }> => {
      const r = await axios.delete(api.v2`cleanup/flows`);
      return r.data;
    },
    mutationKey: getOrphanedFlowsKey(),
    onError: (error) => {
      log.error(error, "Failed to delete orphan flows");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data) => {
      toast.success({
        title: "Deleted",
        message: `Flows deleted.${
          data?.total ? ` Messages deleted: ${data.total}` : ""
        }`,
      });
      qc.invalidateQueries({ queryKey: getOrphanedFlowsKey() }).catch(
        log.error,
      );
      qc.invalidateQueries({
        queryKey: getCleanupSectionStatusKey("flows"),
      }).catch(log.error);
    },
  });
}

const getOrphanedClisKey = (full?: boolean): QueryKey =>
  full ? ["cleanup", "clis"] : ["cleanup", "clis", "stats"];

const OrphanedClisSchema = z.object({
  total: z.number(),
  clis: z.array(z.number()).nullish(),
});

export type OrphanedClis = z.infer<typeof OrphanedClisSchema>;

export const useOrphanedClis = (full?: boolean) => {
  return useGetQuery({
    url: api.v2`cleanup/clis`,
    queryKey: getOrphanedClisKey(full),
    schema: OrphanedClisSchema,
    params: {
      full,
    },
  });
};

export function useOrphanClisDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ total: number }> => {
      const r = await axios.delete(api.v2`cleanup/clis`);
      return r.data;
    },
    mutationKey: getOrphanedClisKey(),
    onError: (error) => {
      log.error(error, "Failed to delete orphan clis");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data) => {
      toast.success({
        title: "Deleted",
        message: `Clis deleted.${
          data?.total ? ` Messages deleted: ${data.total}` : ""
        }`,
      });
      qc.invalidateQueries({ queryKey: getOrphanedClisKey() }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getCleanupSectionStatusKey("clis"),
      }).catch(log.error);
    },
  });
}

const getOldSessionsKey = (): QueryKey => ["cleanup", "sessions"];

const OldSessionsBucketItemSchema = z.object({
  count: z.number(),
  owner: z.string(),
});

const OldSessionsBucketsSchema = z.object({
  "30": z.array(OldSessionsBucketItemSchema),
  "10": z.array(OldSessionsBucketItemSchema),
  "5": z.array(OldSessionsBucketItemSchema),
});

const OldSessionsSchema = z.object({
  radius: OldSessionsBucketsSchema.nullish(),
  tacacs: OldSessionsBucketsSchema.nullish(),
});

export type OldSessions = z.infer<typeof OldSessionsSchema>;

export const useOldSessions = () => {
  return useGetQuery({
    url: api.v2`cleanup/sessions`,
    queryKey: getOldSessionsKey(),
    schema: OldSessionsSchema,
  });
};

const getCleanupSettingsKey = (): QueryKey => ["cleanup", "settings"];

const CleanerConfigSchema = z.object({
  enabled: z.boolean(),
  cron: zodCron,
  older_than: zodDuration,
});

export type CleanerConfig = z.infer<typeof CleanerConfigSchema>;

const CleanerStatusSchema = z.object({
  config: CleanerConfigSchema,
  runs: z
    .object({
      last_run: zodTime,
      next_run: zodTime,
    })
    .nullish(),
});

export type CleanerStatus = z.infer<typeof CleanerStatusSchema>;

export const useCleanerStatus = () => {
  return useGetQuery({
    url: api.v2`cleanup/cleaner`,
    queryKey: getCleanupSettingsKey(),
    schema: CleanerStatusSchema,
  });
};

export const defaultCleanerCfgIFEmpty = (
  cfg: Partial<CleanerConfig>,
): CleanerConfig => ({
  cron: cfg.cron || "0 23 * * *",
  enabled: cfg.enabled || false,
  older_than: cfg.older_than
    ? isZeroDuration(cfg.older_than)
      ? zodDuration.parse("5d")
      : cfg.older_than
    : zodDuration.parse("5d"),
});

export const useCleanerUpdate = () => {
  const qc = useQueryClient();
  return useMutation<unknown, DefaultError, CleanerConfig>({
    mutationFn: async (cfg) => {
      await axios.put(api.v2`cleanup/cleaner`, {
        ...cfg,
        older_than: durationToMilliseconds(cfg.older_than),
      });
    },
    onError: (error) => {
      log.error(error, "Failed to delete orphan clis");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
      qc.invalidateQueries({ queryKey: getCleanupSettingsKey() }).catch(
        log.error,
      );
    },
    onSuccess: () => {
      toast.success({ title: "Updated", message: "Cleanup settings updated" });
      qc.invalidateQueries({ queryKey: getCleanupSettingsKey() }).catch(
        log.error,
      );
    },
  });
};

const StatusLevelSchema = z.enum(["success", "info", "warning", "danger"]);

export type StatusLevel = z.infer<typeof StatusLevelSchema>;

const StatusSchema = z.object({
  level: StatusLevelSchema,
  type: z.enum(["icon", "text"]).optional(),
  value: z.any(),
});

export type CleanupSectionStatus = z.infer<typeof StatusSchema>;

export type CleanupSection =
  | "flows"
  | "clis"
  | "sessions"
  | "processes"
  | "scheduled";

const getCleanupSectionStatusKey = (section: CleanupSection): QueryKey => [
  "cleanup",
  section,
  "status",
];

export function useCleanupSectionStatus(section: CleanupSection) {
  return useGetQuery({
    url: api.v2`cleanup/${section}/status`,
    queryKey: getCleanupSectionStatusKey(section),
    schema: StatusSchema,
    retryOptions: { maxFailures: 1 },
  });
}

type OldSessionsDeleteOptions = {
  older_than_days: number;
  proto: Protos;
};

export function useOldSessionsDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      ops: OldSessionsDeleteOptions,
    ): Promise<{ total: number }> => {
      const r = await axios.delete(api.v2`cleanup/sessions`, { params: ops });
      return r.data;
    },
    mutationKey: getOldSessionsKey(),
    onError: (error) => {
      log.error(error, "Failed to delete old sessions");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data) => {
      toast.success({
        title: "Deleted",
        message: `Old sessions deleted.${
          data?.total ? ` Sessions deleted: ${data.total}` : ""
        }`,
      });
      qc.invalidateQueries({ queryKey: getOldSessionsKey() }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getCleanupSectionStatusKey("sessions"),
      }).catch(log.error);
    },
  });
}
