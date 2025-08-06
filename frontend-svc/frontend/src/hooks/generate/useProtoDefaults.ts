import {
  type DefaultError,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

const getProtoDefaultsKey = (proto: string, user: string): QueryKey => [
  "generate",
  "proto",
  proto,
  "defaults",
  { user },
];

export const getProtoDefaultsKeyAndEnsureDefaults = (
  proto: string,
  user: QueryUser,
) => {
  const queryKey = getProtoDefaultsKey(proto, orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/generate/proto/${proto}/defaults`,
        params: { user },
        schema: z.any(),
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useProtoDefaults(proto: string, user: QueryUser) {
  const queryKey = getProtoDefaultsKeyAndEnsureDefaults(proto, user);
  return useQuery<unknown, DefaultError, any | null>({ queryKey });
}
