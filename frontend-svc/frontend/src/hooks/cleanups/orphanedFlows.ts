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
