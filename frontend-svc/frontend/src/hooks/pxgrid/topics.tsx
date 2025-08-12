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

import { pxGridTopicsSchema } from "./schemas";

const getPxGridConnectionTopicsKey = (id: string, user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { id },
  "topics",
];

export const usePxGridConnectionTopics = (
  id: string,
  user: string | null | undefined,
) => {
  const queryKey = getPxGridConnectionTopicsKey(id, orMe(user));
  return useGetQuery({
    url: api.v2`/pxgrid/connections/${id}/topics`,
    schema: pxGridTopicsSchema,
    queryKey,
    params: { user },
    mapper(value) {
      return value;
    },
  });
};

export function usePxGridConnectionTopicSubscribe(
  id: string,
  user?: QueryUser,
) {
  return useMutation<
    unknown,
    DefaultError,
    { service: string; topic: string; action: "subscribe" | "unsubscribe" }
  >({
    mutationFn: async ({ service, topic, action }) => {
      const r = await axios.request({
        url: api.v2`/pxgrid/connections/${id}/services/${service}/subscriptions`,
        method: action === "subscribe" ? "POST" : "DELETE",
        data: { topic },
        params: { user },
      });
      return r.data;
    },
    onError: (error, { action }) => {
      log.error(error, `Failed to ${action} to topic`);
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (_, { action }) => {
      toast.success({
        title: "Success",
        message:
          action === "subscribe"
            ? "Subscribed to topic"
            : "Unsubscribed from topic",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getPxGridConnectionTopicsKey(id, orMe(user)),
      });
    },
  });
}
