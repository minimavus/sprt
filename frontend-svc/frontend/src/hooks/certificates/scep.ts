import {
  DefaultError,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn, useGetQuery } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import failOrRetry from "@/utils/failOrRetry";
import { log } from "@/utils/log";
import { noNull } from "@/utils/noNull";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import { baseCertificateSchema } from ".";

const getScepServersKey = (user: string): QueryKey => [
  "scep",
  "servers",
  { user },
];

const ScepServerSchema = z.object({
  ca_certificates: z.array(z.string()),
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  signer: z.string(),
  url: z.string(),
  challenge: z.string().nullish().transform(noNull),
});

export type ScepServer = z.infer<typeof ScepServerSchema>;

export const ScepCaCertificateSchema = baseCertificateSchema.extend({
  id: z.string(),
  type: z.literal("scep_ca"),
});

export type ScepCaCertificate = z.infer<typeof ScepCaCertificateSchema>;

const ScepServerWithParsedCertsSchema = ScepServerSchema.extend({
  ca_certificates: z.array(ScepCaCertificateSchema).nullable(),
});

export type ScepServerWithParsedCerts = z.infer<
  typeof ScepServerWithParsedCertsSchema
>;

const ScepServersResponseSchema = z.object({
  servers: z.array(ScepServerSchema).nullable(),
});

export type ScepServers = z.infer<typeof ScepServersResponseSchema>;

export const getScepServersKeyAndEnsureDefaults = (user: QueryUser) => {
  const queryKey = getScepServersKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/scep/servers`,
        params: { user },
        schema: ScepServersResponseSchema,
        withSignal: true,
        allowEmpty: true,
      }),
      select: (data: ScepServers) => data?.servers ?? [],
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useScepServers(user: QueryUser) {
  const queryKey = getScepServersKeyAndEnsureDefaults(user);
  return useQuery<unknown, DefaultError, ScepServer[]>({ queryKey });
}

const getScepServerKey = (user: string, id: string): QueryKey => [
  "scep",
  "servers",
  { user },
  id,
];

export function useScepServer(id: string | undefined, user: QueryUser) {
  return useGetQuery({
    url: id ? api.v2`/scep/servers/${id}` : "",
    schema: z.object({ server: ScepServerWithParsedCertsSchema.nullable() }),
    queryKey: id ? getScepServerKey(orMe(user), id) : undefined,
    params: { user },
    mapper(value) {
      return value.server;
    },
  });
}

type ScepServerUpsertVariables = Pick<
  ScepServer,
  "name" | "url" | "signer" | "ca_certificates" | "challenge"
> & { user: QueryUser; id?: string };

export function useScepServerUpsert() {
  const qc = useQueryClient();

  return useMutation<unknown, DefaultError, ScepServerUpsertVariables>({
    mutationFn: async ({ id, user, ...body }) => {
      if (id) {
        await axios.put(api.v2`/scep/servers/${id}`, body, {
          params: { user },
        });
      } else {
        await axios.post(api.v2`/scep/servers`, body, { params: { user } });
      }
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        message: "SCEP server saved successfully",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSettled: (_d, _err, variables) => {
      if (variables.id) {
        qc.resetQueries({
          queryKey: getScepServerKey(orMe(variables.user), variables.id),
        }).catch(log.error);
      }
      qc.invalidateQueries({
        queryKey: getScepServersKey(orMe(variables.user)),
      }).catch(log.error);
    },
  });
}

export function useScepServerDelete() {
  const qc = useQueryClient();

  return useMutation<unknown, DefaultError, { id: string[]; user?: QueryUser }>(
    {
      mutationFn: async ({ id, user }) => {
        if (id.length === 1) {
          await axios.delete(api.v2`/scep/servers/${id[0]}`, {
            params: { user },
          });
        } else {
          await axios.delete(api.v2`/scep/servers`, {
            params: { user },
            data: { ids: id },
          });
        }
      },
      onSuccess: (_, { id }) => {
        toast.success({
          title: "Success",
          message: `SCEP server${
            id.length > 1 ? "s" : ""
          } deleted successfully`,
        });
      },
      onError: (error) => {
        toast.error({
          title: "Error",
          message: getErrorMessage(error),
        });
      },
      onSettled: (_d, _err, variables) => {
        qc.invalidateQueries({
          queryKey: getScepServersKey(orMe(variables.user)),
        }).catch(log.error);
        for (const id of variables.id) {
          qc.resetQueries({
            queryKey: getScepServerKey(orMe(variables.user), id),
          })
            .then(() => {
              qc.removeQueries({
                queryKey: getScepServerKey(orMe(variables.user), id),
              });
            })
            .catch(log.error);
        }
      },
    },
  );
}
