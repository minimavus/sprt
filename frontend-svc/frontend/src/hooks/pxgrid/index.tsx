import {
  DefaultError,
  QueryKey,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import { NewConnectionFields } from "@/pages/pxGrid/NewConnection/form";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import failOrRetry from "@/utils/failOrRetry";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import { QueryUser } from "../useQueryUser";
import {
  PxGridConnection,
  pxGridConnectionSchema,
  pxGridConnectionsSchema,
  pxGridStatusSchema,
  type PxGridConnections,
  type PxGridStatus,
} from "./schemas";

const getPxGridStatusKey = (): QueryKey => ["pxgrid", "status"];

const getAllPxGridConnectionsKey = (user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { all: true },
];

const getOnePxGridConnectionKey = (id: string, user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { id },
];

export const getPxGridStatusKeyAndEnsureDefaults = () => {
  const queryKey = getPxGridStatusKey();

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/pxgrid/status`,
        schema: pxGridStatusSchema,
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function usePxGridStatus() {
  const queryKey = getPxGridStatusKey();
  return useQuery<unknown, DefaultError, PxGridStatus>({ queryKey });
}

export const getPxGridConnectionsKeyAndEnsureDefaults = (
  user: string | null | undefined,
) => {
  const queryKey = getAllPxGridConnectionsKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/pxgrid/connections`,
        params: { user },
        schema: pxGridConnectionsSchema,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function usePxGridConnections(user: QueryUser) {
  const queryKey = getPxGridConnectionsKeyAndEnsureDefaults(user);
  return useQuery<unknown, DefaultError, PxGridConnections>({ queryKey });
}

export const getOnePxGridConnectionKeyAndEnsureDefaults = (
  id: string,
  user: string | null | undefined,
) => {
  const queryKey = getOnePxGridConnectionKey(id, orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def?.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/pxgrid/connections/${id}`,
        params: { user },
        schema: pxGridConnectionSchema,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function usePxGridConnection(id: string, user: QueryUser) {
  const queryKey = getOnePxGridConnectionKeyAndEnsureDefaults(id, user);
  return useQuery<unknown, DefaultError, PxGridConnection>({ queryKey });
}

export const usePxGridConnectionCreate = (user: QueryUser) => {
  const qc = queryClient;
  return useMutation<
    { id: string },
    DefaultError,
    Partial<NewConnectionFields>
  >({
    mutationFn: async (data) => {
      const r = await axios.post(api.v2`/pxgrid/connections`, data, {
        params: { user },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to create pxGrid connection");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Created",
        message: "pxGrid connection created.",
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getAllPxGridConnectionsKey(orMe(user)),
      }).catch(log.error);
    },
  });
};

export function usePxGridConnectionDelete(user: QueryUser) {
  const qc = queryClient;
  return useMutation<{ id: string }, DefaultError, { id: string }>({
    mutationFn: async ({ id }) => {
      await axios.delete(api.v2`/pxgrid/connections/${id}`, {
        params: { user },
      });
      return { id };
    },
    onError: (error) => {
      log.error(error, "Failed to delete pxGrid connection");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Deleted",
        message: "pxGrid connection deleted.",
      });
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({
        queryKey: getAllPxGridConnectionsKey(orMe(user)),
      }).catch(log.error);
      qc.removeQueries({
        queryKey: getOnePxGridConnectionKey(id, orMe(user)),
      });
    },
  });
}

type RefreshResponse = {
  state: string;
  version: string;
};

export function usePxGridConnectionStateRefresh(user: QueryUser) {
  const qc = queryClient;
  return useMutation<RefreshResponse, DefaultError, { id: string }>({
    mutationFn: async ({ id }) => {
      const r = await axios.post(
        api.v2`/pxgrid/connections/${id}/state`,
        {},
        { params: { user } },
      );
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to refresh pxGrid connection state");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Refreshed",
        message: "pxGrid connection state refreshed.",
      });
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({
        queryKey: getOnePxGridConnectionKey(id, orMe(user)),
      }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getAllPxGridConnectionsKey(orMe(user)),
      }).catch(log.error);
    },
  });
}
