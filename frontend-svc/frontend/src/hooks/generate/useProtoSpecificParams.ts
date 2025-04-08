import { DefaultError, QueryKey, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

import { ProtoDefinition, ProtoDefinitionSchema } from "./schemas";

const getProtoSpecificParametersKey = (
  proto: string,
  user: string,
): QueryKey => ["generate", "proto", proto, "parameters", { user }];

export const getProtoSpecificParametersKeyAndEnsureDefaults = (
  proto: string,
  user: QueryUser,
) => {
  const queryKey = getProtoSpecificParametersKey(proto, orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/generate/proto/${proto}/parameters`,
        params: { user },
        schema: ProtoDefinitionSchema,
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
      staleTime: Infinity,
      refetchInterval: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });
  }

  return queryKey;
};

export function useProtoSpecificParameters(proto: string, user: QueryUser) {
  const queryKey = getProtoSpecificParametersKeyAndEnsureDefaults(proto, user);
  return useQuery<unknown, DefaultError, ProtoDefinition | null>({ queryKey });
}
