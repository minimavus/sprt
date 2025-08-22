import type { QueryKey } from "@tanstack/react-query";
import z from "zod";

import { useGetQuery } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";

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

export const getCleanupSectionStatusKey = (
  section: CleanupSection,
): QueryKey => ["cleanup", section, "status"];

export function useCleanupSectionStatus(section: CleanupSection) {
  return useGetQuery({
    url: api.v2`cleanup/${section}/status`,
    queryKey: getCleanupSectionStatusKey(section),
    schema: StatusSchema,
    retryOptions: { maxFailures: 1 },
  });
}
