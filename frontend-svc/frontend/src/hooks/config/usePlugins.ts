import {
  type DefaultError,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";

import { type Plugins, pluginsSchema } from "./schemas";

const getUsePluginsKey = (): QueryKey => ["globals", "plugins"];

export const getUsePluginsKeyAndEnsureDefaults = (): QueryKey => {
  const queryKey = getUsePluginsKey();

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/config/plugins`,
        schema: pluginsSchema,
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export const usePlugins = () => {
  const queryKey = getUsePluginsKeyAndEnsureDefaults();
  return useQuery<unknown, DefaultError, Plugins>({ queryKey });
};
