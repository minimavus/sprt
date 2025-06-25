import {
  DefaultError,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod/v4";

import { useGetQuery } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

const getAPISettingsKey = (user: string): QueryKey => ["settings", "api", user];

const APISettingsSchema = z
  .object({
    token: z.string().nullish(),
  })
  .nullish();

const APISettingsResponseSchema = z.object({
  settings: APISettingsSchema,
});

export type APISettings = z.infer<typeof APISettingsSchema>;

export const useAPISettings = (user: QueryUser) => {
  return useGetQuery({
    queryKey: getAPISettingsKey(orMe(user)),
    url: api.v2`settings/api`,
    params: { user },
    schema: APISettingsResponseSchema,
    mapper(value) {
      return value?.settings;
    },
  });
};

export const useAPISettingsUpdate = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    DefaultError,
    { action: "enable" | "disable" | "regen" }
  >({
    mutationFn: async ({ action }) => {
      let url = api.v2`settings/api/`;
      switch (action) {
        case "enable":
          url += "enable";
          break;
        case "disable":
          url += "disable";
          break;
        case "regen":
          url += "regenerate-token";
          break;
      }
      return (await axios.post(url, undefined, { params: { user } })).data;
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
      qc.invalidateQueries({ queryKey: getAPISettingsKey(orMe(user)) }).catch(
        log.error,
      );
    },
    onSuccess: (_, { action }) => {
      toast.success({
        title: "Updated",
        message: `API token ${action === "disable" ? "disabled" : action === "enable" ? "enabled" : "regenerated"}`,
      });
      qc.invalidateQueries({ queryKey: getAPISettingsKey(orMe(user)) }).catch(
        log.error,
      );
    },
  });
};
