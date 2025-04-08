import { DefaultError, QueryKey, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

import { isInDev } from "../useInitial";
import { VariableDefinition, VariableDefinitionSchema } from "./schemas";

const getVariableDefKey = (variable: string, user: string): QueryKey => [
  "generate",
  "variable",
  variable,
  { user },
];

export const getVariableDefKeyAndEnsureDefaults = (
  variable: string,
  user: QueryUser,
) => {
  const queryKey = getVariableDefKey(variable, orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/generate/variables/${variable}`,
        params: { user },
        schema: VariableDefinitionSchema,
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
      ...(isInDev()
        ? {}
        : {
            staleTime: Infinity,
            refetchInterval: false,
            refetchOnMount: true,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
          }),
    });
  }

  return queryKey;
};

export function useVariableDef(variable: string, user: QueryUser) {
  const queryKey = getVariableDefKeyAndEnsureDefaults(variable, user);
  return useQuery<unknown, DefaultError, VariableDefinition>({
    queryKey,
  });
}
