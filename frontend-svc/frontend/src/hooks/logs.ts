import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod/v4";

import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { toast } from "@/utils/toasts";

import { useGetQuery } from "./useGetQuery";

const LogOwnerSchema = z.object({
  owner: z.string(),
  last_update: z.string(),
});

const LogOwnersSchema = z.object({ owners: z.array(LogOwnerSchema) });

export type LogOwners = z.infer<typeof LogOwnersSchema>;

const getLogOwnersKey = (): QueryKey => ["logs", "owners"];

export function useLogOwners() {
  return useGetQuery({
    url: api.v2`logs`,
    schema: LogOwnersSchema,
    queryKey: getLogOwnersKey(),
    mapper(value) {
      return value?.owners;
    },
  });
}

const LogChunkSchema = z.object({
  owner: z.string(),
  chunk: z.string(),
  started: z.string(),
  count: z.number(),
});

export type LogChunk = z.infer<typeof LogChunkSchema>;

const LogChunksOfOwnerResponseSchema = z.object({
  chunks: z.array(LogChunkSchema),
  logs_owner: z.string(),
  pack: z.array(z.string()),
});

export type LogChunksOfOwnerResponse = z.infer<
  typeof LogChunksOfOwnerResponseSchema
>;

const getLogOwnerChunksKey = (o: string): QueryKey => ["logs", "owner", o];

export function useLogOwnerChunks(o: string) {
  return useGetQuery({
    url: api.v2`logs/${o}`,
    queryKey: getLogOwnerChunksKey(o),
    schema: LogChunksOfOwnerResponseSchema,
  });
}

const LogItemSchema = z.object({
  chunk: z.string(),
  id: z.string(),
  loglevel: z.string(),
  message: z.string(),
  owner: z.string(),
  timestamp: z.string(),
});

export type LogItem = z.infer<typeof LogItemSchema>;

const LogsInChunkResponseSchema = z.object({
  logs: z.array(LogItemSchema),
});

export type LogsInChunkResponse = z.infer<typeof LogsInChunkResponseSchema>;

const getLogChunkKey = (
  o: string,
  chunk: string,
  preview?: boolean,
): QueryKey =>
  preview
    ? ["logs", "owner", o, `preview-${chunk}`]
    : ["logs", "owner", o, chunk];

export function useLogChunk(o: string, chunk: string, preview?: boolean) {
  return useGetQuery({
    url: api.v2`logs/${o}/${chunk}`,
    queryKey: getLogChunkKey(o, chunk, preview),
    schema: LogsInChunkResponseSchema,
    params: { preview },
  });
}

export function useLogsDelete(o: string, chunk?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ deleted: number }> => {
      const r = await axios.delete(
        api.v2`logs/${o}${chunk ? `/${chunk}` : ""}`,
      );
      return r.data;
    },
    mutationKey: chunk ? getLogChunkKey(o, chunk) : getLogOwnerChunksKey(o),
    onError: (error) => {
      log.error(error, "Failed to delete resource");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data) => {
      toast.success({
        title: "Deleted",
        message: `Chunk${chunk ? "" : "s"} deleted.${
          data?.deleted ? ` Log records deleted: ${data.deleted}` : ""
        }`,
      });
      qc.removeQueries({
        queryKey: chunk ? getLogChunkKey(o, chunk) : getLogOwnerChunksKey(o),
      });
      if (chunk) {
        qc.invalidateQueries({ queryKey: getLogOwnerChunksKey(o) }).catch(
          log.error,
        );
      } else {
        qc.invalidateQueries({ queryKey: getLogOwnersKey() }).catch(log.error);
      }
    },
  });
}
