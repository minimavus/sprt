import { DefaultError, QueryKey, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";

import { GlobalConfig, globalConfigSchema } from "./schemas";

const getUseConfigKey = (): QueryKey => ["globals", "config"];

export const getUseConfigKeyAndEnsureDefaults = (): QueryKey => {
  const queryKey = getUseConfigKey();

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/config`,
        schema: globalConfigSchema,
        withSignal: true,
      }),
      select: (data: GlobalConfig) => {
        return data?.config;
      },
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export const useConfig = () => {
  const queryKey = getUseConfigKey();
  return useQuery<unknown, DefaultError, GlobalConfig["config"]>({ queryKey });
};
