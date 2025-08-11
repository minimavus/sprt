import {
  type DefaultError,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import type { RadiusForm } from "@/pages/Generate/RADIUS/form";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import { getJobsOfUserKey } from "../jobs";
import type { QueryUser } from "../useQueryUser";

export const useStart = (user: QueryUser) => {
  const qc = useQueryClient();

  return useMutation<void, DefaultError, RadiusForm>({
    mutationFn: async (data): Promise<void> => {
      const r = await axios.post(api.v2`/generate`, data, {
        params: { user },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to start new generate job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Started",
        message: `New generate job started`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getJobsOfUserKey(orMe(user)),
      }).catch(log.error);
    },
  });
};
