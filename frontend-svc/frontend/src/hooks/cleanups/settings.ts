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
import { zodCron } from "@/utils/zodCron";
import {
  durationToMilliseconds,
  isZeroDuration,
  zodDuration,
} from "@/utils/zodDuration";
import { zodTime } from "@/utils/zodTime";

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
