import {
  type DefaultError,
  type QueryKey,
  useMutation,
} from "@tanstack/react-query";
import axios from "axios";

import { queryClient } from "@/hooks/queryClient";
import { useGetQuery } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import {
  type PxGridRestResponse,
  PxGridRestResponseSchema,
  pxGridServiceSchema,
  pxGridServicesSchema,
} from "./schemas";

const getPxGridConnectionServicesKey = (id: string, user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { id },
  "services",
];

export const usePxGridConnectionServices = (
  id: string,
  user: string | null | undefined,
) => {
  const queryKey = getPxGridConnectionServicesKey(id, orMe(user));
  return useGetQuery({
    url: api.v2`/pxgrid/connections/${id}/services`,
    schema: pxGridServicesSchema,
    queryKey,
    params: { user },
    mapper(value) {
      return value?.services;
    },
  });
};

const getPxGridConnectionServiceKey = (
  id: string,
  user: string,
  service: string,
): QueryKey => ["pxgrid", "connections", user, { id }, "services", { service }];

export const usePxGridConnectionService = (
  id: string,
  user: string | null | undefined,
  service: string,
) => {
  const queryKey = getPxGridConnectionServiceKey(id, orMe(user), service);
  return useGetQuery({
    url: api.v2`/pxgrid/connections/${id}/services/${service}`,
    schema: pxGridServiceSchema,
    queryKey,
    params: { user },
  });
};

export function usePxGridConnectionServiceLookup(id: string, user?: QueryUser) {
  const qc = queryClient;
  return useMutation<unknown, DefaultError, { service: string }>({
    mutationFn: async ({ service }) => {
      const r = await axios.post(
        api.v2`/pxgrid/connections/${id}/services/${service}/lookup`,
        {},
        {
          params: { user },
        },
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
        title: "Service Lookup",
        message: "Service lookup completed.",
      });
    },
    onSettled: (_data, _err, { service }) => {
      qc.invalidateQueries({
        queryKey: getPxGridConnectionServicesKey(id, orMe(user)),
      }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getPxGridConnectionServiceKey(id, orMe(user), service),
      }).catch(log.error);
    },
  });
}

export function usePxGridConnectionServiceRest(id: string, user?: QueryUser) {
  return useMutation<
    PxGridRestResponse,
    DefaultError,
    { service: string; method: string; params: any }
  >({
    mutationFn: async ({ service, ...data }) => {
      const r = await axios.post(
        api.v2`/pxgrid/connections/${id}/services/${service}/rest`,
        data,
        {
          params: { user },
        },
      );
      return PxGridRestResponseSchema.parse(r.data);
    },
    onError: (error) => {
      log.error(error, "Failed to execute pxGrid service REST request");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Service REST",
        message: "Service REST completed.",
      });
    },
  });
}
