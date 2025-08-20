import type { ComboboxItemGroup } from "@mantine/core";
import {
  type DefaultError,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

import { NADSourceSchema, type NADSourcesResponse } from "./schemas";

const getNADSourcesQueryKey = (includeAll: boolean, user: string): QueryKey => [
  "generate",
  "nad-sources",
  { user, includeAll },
];

export const getNADSourcesQueryKeyAndEnsureDefaults = (
  includeAll: boolean,
  user: QueryUser,
) => {
  const queryKey = getNADSourcesQueryKey(includeAll, orMe(user));

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
    queryKey: getNADSourcesQueryKeyAndEnsureDefaults(false, user),
  });
}

export function useNADSourcesAll(user: QueryUser) {
  return useQuery<unknown, DefaultError, NADSourcesResponse | null>({
    queryKey: getNADSourcesQueryKeyAndEnsureDefaults(true, user),
  });
}

const FamilyName: Record<string, string> = {
  "4": "IPv4",
  "6": "IPv6",
};

export function useNADSourcesCombined(user: QueryUser) {
  const { data, ...rest } = useNADSources(user);

  const options = useMemo(() => {
    if (!data) return [];

    return data
      .reduce((acc, source) => {
        const familyName = FamilyName[source.family] ?? source.family;
        const group = acc.find((g) => g.group === familyName);
        const compiled = {
          value: source.interface
            ? `[${source.interface}]:[${source.address}]`
            : `${source.address}`,
          label: source.interface
            ? `${source.address} (${source.interface})`
            : source.address,
        };
        if (group) {
          group.items.push(compiled);
        } else {
          acc.push({ group: familyName, items: [compiled] });
        }
        return acc;
      }, [] as ComboboxItemGroup[])
      .sort((a, b) => a.group.localeCompare(b.group));
  }, [data]);

  return {
    data: options,
    ...rest,
  };
}
