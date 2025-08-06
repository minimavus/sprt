import {
  type DefaultError,
  type QueryKey,
  type UndefinedInitialDataOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { minutesToMilliseconds, secondsToMilliseconds } from "date-fns";
import { clone } from "rambda";
import type { Path } from "react-hook-form";
import type { z } from "zod";

import {
  UserAttributesSchema,
  UserSessionSchema,
  useInitial,
} from "@/hooks/useInitial";
import { usePreferredTheme } from "@/hooks/usePreferredTheme";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { log } from "@/utils/log";
import set from "@/utils/set";
import unset from "@/utils/unset";

type UserSession = z.infer<typeof UserSessionSchema>;
type UserAttributes = z.infer<ReturnType<typeof UserAttributesSchema>>;

export function useUser() {
  const { UserSession } = useInitial();

  const q = useQuery<UserSession>({
    initialData: UserSession,
    retry: failOrRetry(),
    queryKey: ["user-data", "session"],
    staleTime: secondsToMilliseconds(30),
    queryFn: async ({ signal }) => {
      const r = await axios.get<UserSession>(api.ui`/me/session`, { signal });

      return UserSessionSchema.parse(r.data);
    },
  });

  return q;
}

const attributesQueryKey = ["user-data", "attributes"];

export function useAllUserAttributes() {
  const { UserAttributes } = useInitial();
  const theme = usePreferredTheme();

  const q = useQuery<UserAttributes>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: attributesQueryKey,
    initialData: UserAttributes,
    retry: failOrRetry(),
    staleTime: minutesToMilliseconds(2),
    queryFn: async ({ signal }) => {
      const r = await axios.get<UserAttributes>(api.ui`/me/attributes`, {
        signal,
      });

      return UserAttributesSchema(theme).parse(r.data);
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: attributesQueryKey });

      const previousAttributes = queryClient.getQueryData(attributesQueryKey);
      if (!variables?.attribute) return { previousAttributes };

      let optimistic = clone(previousAttributes || {});

      if (typeof variables.value === "undefined") {
        optimistic = unset(variables.attribute, optimistic);
      } else {
        optimistic = set(variables.attribute, variables.value, optimistic);
      }

      queryClient.setQueryData(attributesQueryKey, optimistic);

      return { previousAttributes };
    },
    onError: (err, _skip, context) => {
      log.error(err, "Failed to update user attributes");
      queryClient.setQueryData(attributesQueryKey, context?.previousAttributes);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(attributesQueryKey, data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attributesQueryKey });
    },
    mutationFn: async (variables: {
      attribute: Path<UserAttributes>;
      value: unknown;
    }) => {
      let current =
        queryClient.getQueryData<UserAttributes>(attributesQueryKey);
      if (!variables?.attribute) return current;

      current ||= {};

      if (typeof variables.value === "undefined") {
        current = unset(variables.attribute, current);
      } else {
        current = set(variables.attribute, variables.value, current);
      }

      await axios.put(api.ui`/me/attributes`, current, {
        headers: { "content-type": "application/json" },
      });
      return current;
    },
  });

  return {
    ...q,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
    updateAsync: mutation.mutateAsync,
  };
}

export function useIsDarkTheme(): boolean {
  const theme = usePreferredTheme();
  const { data } = useAllUserAttributes();
  return (data?.ui?.theme || theme) === "dark";
}

const getPermissionKey = (permission: string): QueryKey => [
  "permissions",
  permission,
];

const getQueryParamsForPermission = (
  permission: string,
): UndefinedInitialDataOptions<unknown, DefaultError, boolean, QueryKey> => ({
  queryKey: getPermissionKey(permission),
  placeholderData: false,
  retry: failOrRetry(),
  enabled: true,
  staleTime: minutesToMilliseconds(10),
  queryFn: async ({ signal }) => {
    const r = await axios.get<{ allowed: boolean }>(api.ui`/me/permission`, {
      signal,
      params: { permission },
    });

    return r.data?.allowed || false;
  },
});

export function usePermission(permission: string) {
  const { data } = useQuery(getQueryParamsForPermission(permission));

  return data;
}
