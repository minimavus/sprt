import { DefaultError, QueryKey, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

import { NADSourceSchema, NADSourcesResponse } from "./schemas";

const getNADSourcesQueryKey = (user: string): QueryKey => [
  "generate",
  "nad-sources",
  { user },
];

export const getNADSourcesQueryKeyAndEnsureDefaults = (user: QueryUser) => {
  const queryKey = getNADSourcesQueryKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/generate/sources`,
        params: { user },
        schema: z.array(NADSourceSchema),
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useNADSources(user: QueryUser) {
  return useQuery<unknown, DefaultError, NADSourcesResponse | null>({
    queryKey: getNADSourcesQueryKeyAndEnsureDefaults(user),
  });
}
