import {
  keepPreviousData,
  useQuery,
  type DefaultError,
  type QueryKey,
} from "@tanstack/react-query";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import type { Protos } from "@/hooks/zodProto";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";
import { Filter } from "@/utils/zodFilter";
import type { PaginationRequest } from "@/utils/zodPagination";
import { Sort } from "@/utils/zodSort";

import {
  compactSessionSummarySchema,
  ProtoBulksSchema,
  RadiusSessionDetailsSchema,
  RadiusSessionsInBulkSchema,
  SessionsSummarySchema,
  TacacsSessionDetailsSchema,
  TacacsSessionsInBulkSchema,
  type ProtoBulks,
  type RadiusSessionDetails,
  type SessionsInBulk,
  type SessionsSummary,
} from "./schemas";

type UseSessionsSummaryOptions = {
  user?: QueryUser;
};

const getSessionsSummaryKey = (user: string): QueryKey => [
  "sessions-summary",
  user,
];

export const getSessionsSummaryKeyAndEnsureDefaults = (user: QueryUser) => {
  const queryKey = getSessionsSummaryKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`sessions/summary`,
        schema: SessionsSummarySchema,
        params: { user },
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useSessionsSummary({ user }: UseSessionsSummaryOptions = {}) {
  const queryKey = getSessionsSummaryKeyAndEnsureDefaults(user);
  return useQuery<unknown, DefaultError, SessionsSummary>({
    queryKey,
  });
}

const getSessionInBulkKey = (
  user: string,
  server: string,
  proto: Protos,
  bulk: string,
  pagination: PaginationRequest,
  sort: Sort | undefined,
  filter: Filter | undefined,
): QueryKey => [
  "sessions",
  user,
  server,
  { proto, bulk },
  pagination,
  { sort, filter },
];

export const getSessionInBulkKeyAndEnsureDefaults = (
  user: QueryUser,
  server: string,
  proto: Protos,
  bulk: string,
  pagination: PaginationRequest,
  sort: Sort | undefined,
  filter: Filter | undefined,
) => {
  const queryKey = getSessionInBulkKey(
    orMe(user),
    server,
    proto,
    bulk,
    pagination,
    sort,
    filter,
  );

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`sessions/${proto}/${server}/${bulk}`,
        schema:
          proto === "radius"
            ? RadiusSessionsInBulkSchema
            : TacacsSessionsInBulkSchema,
        params: { user, ...pagination, ...sort, ...filter },
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

type UseSessionInBulkOptions = {
  user?: QueryUser;
  server: string;
  proto: Protos;
  bulk: string;
  pagination: PaginationRequest;
  sort?: Sort;
  filter?: Filter;
};

export function useSessionInBulk<S = SessionsInBulk>({
  user,
  server,
  proto,
  bulk,
  pagination,
  sort,
  filter,
}: UseSessionInBulkOptions) {
  const queryKey = getSessionInBulkKeyAndEnsureDefaults(
    user,
    server,
    proto,
    bulk,
    pagination,
    sort,
    filter,
  );

  return useQuery<unknown, DefaultError, S>({
    queryKey,
    placeholderData: keepPreviousData,
  });
}

export function getSessionInBulk({
  user,
  server,
  proto,
  bulk,
  pagination,
  sort,
  filter,
}: UseSessionInBulkOptions) {
  const queryKey = getSessionInBulkKeyAndEnsureDefaults(
    user,
    server,
    proto,
    bulk,
    pagination,
    sort,
    filter,
  );

  return queryClient.ensureQueryData<unknown, DefaultError, SessionsInBulk>({
    queryKey,
  });
}

const getSessionKey = (
  user: string,
  server: string,
  bulk: string,
  session: string,
  proto: Protos,
): QueryKey => ["sessions", user, server, { proto, bulk }, session];

export const getSessionKeyAndEnsureDefaults = (
  user: QueryUser,
  server: string,
  bulk: string,
  session: string,
  proto: Protos,
) => {
  const queryKey = getSessionKey(orMe(user), server, bulk, session, proto);

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`sessions/${proto}/${server}/${bulk}/session/${session}`,
        schema:
          proto === "radius"
            ? RadiusSessionDetailsSchema
            : TacacsSessionDetailsSchema,
        params: { user },
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useRadiusSession({
  user,
  server,
  bulk,
  session,
}: {
  user?: QueryUser;
  server: string;
  bulk: string;
  session: string;
}) {
  const queryKey = getSessionKeyAndEnsureDefaults(
    user,
    server,
    bulk,
    session,
    "radius",
  );
  return useQuery<unknown, DefaultError, RadiusSessionDetails>({
    queryKey,
  });
}

export const getRadiusBulksKey = (user: string): QueryKey => [
  "radius",
  "bulks",
  user,
];

export const getRadiusBulksKeyAndEnsureDefaults = (user: QueryUser) => {
  const queryKey = getRadiusBulksKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`sessions/radius`,
        params: { user },
        schema: ProtoBulksSchema,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export const useRadiusBulks = (user: QueryUser) => {
  const queryKey = getRadiusBulksKeyAndEnsureDefaults(user);

  return useQuery<unknown, DefaultError, ProtoBulks>({
    queryKey,
  });
};

const getSearchSessionSummary = (
  user: string,
  id: string,
  proto: Protos,
): QueryKey => ["sessions", user, "search", id, proto];

export const getSearchSessionSummaryAndEnsureDefaults = (
  user: QueryUser,
  id: string,
  proto: Protos,
) => {
  const queryKey = getSearchSessionSummary(orMe(user), id, proto);

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`sessions/session-summary/${id}`,
        schema: compactSessionSummarySchema,
        params: { user, proto },
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};
