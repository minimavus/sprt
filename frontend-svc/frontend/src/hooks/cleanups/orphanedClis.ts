import {
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
import { getCleanupSectionStatusKey } from "./status";

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
