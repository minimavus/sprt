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
import type { Protos } from "../zodProto";
import { getCleanupSectionStatusKey } from "./status";

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
