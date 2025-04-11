import {
  useMutation,
  useQueryClient,
  type DefaultError,
  type QueryKey,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

import { useGetQuery } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

const getUserDefaultsKey = (user: string): QueryKey => [
  "settings",
  "defaults",
  user,
];

const UserDefaultsSchema = z.any();

export type UserDefaults = z.infer<typeof UserDefaultsSchema>;

export const useUserDefaults = (user: QueryUser) => {
  return useGetQuery({
    queryKey: getUserDefaultsKey(orMe(user)),
    url: api.v2`/settings/defaults/generate`,
    params: { user },
    schema: UserDefaultsSchema,
  });
};

export const useUserDefaultsUpdate = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<unknown, DefaultError, Partial<UserDefaults>>({
    mutationFn: async (data) => {
      return (
        await axios.post(api.v2`/settings/defaults/generate`, data, {
          params: { user },
        })
      ).data;
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        message: "Default settings updated successfully.",
      });
    },
    onError: (err) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(err),
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getUserDefaultsKey(orMe(user)),
      }).catch(log.error);
    },
  });
};
