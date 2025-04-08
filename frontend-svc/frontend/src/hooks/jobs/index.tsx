import {
  DefaultError,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn, useGetQuery } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import failOrRetry from "@/utils/failOrRetry";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import {
  allJobsUsersSchema,
  Job,
  Jobs,
  jobsSchema,
  JobStats,
  jobStatsSchema,
} from "./schemas";

export type { Job, Jobs };

export function useAllJobsUsers() {
  return useGetQuery({
    queryKey: ["jobs", "all_users"],
    url: api.v2`/jobs/get-users`,
    schema: allJobsUsersSchema,
    mapper: (data) => data.users ?? [],
  });
}

const getJobsOfUserKey = (user: string): QueryKey => ["jobs", { user }];

export const getJobsOfUserKeyAndEnsureDefaults = (
  user: string | null | undefined,
) => {
  const queryKey = getJobsOfUserKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/jobs`,
        params: { user, expand_running: true },
        schema: jobsSchema,
        withSignal: true,
      }),
      retry: failOrRetry(),
    });
  }

  return queryKey;
};

export function useJobsOfUser(user?: QueryUser) {
  const queryKey = getJobsOfUserKeyAndEnsureDefaults(user);
  return useQuery<unknown, DefaultError, Jobs>({ queryKey });
}

const getJobStatsKet = (jobId: string, user: string): QueryKey => [
  "jobs",
  { user },
  "stats",
  jobId,
];

export const useJobStats = (jobId: string, user?: QueryUser) => {
  const queryKey = getJobStatsKet(jobId, orMe(user));
  return useQuery<unknown, DefaultError, JobStats>({
    queryKey,
    queryFn: queryGetFn({
      url: api.v2`/jobs/${jobId}/stats`,
      schema: jobStatsSchema,
      params: { user },
      withSignal: true,
    }),
    retry: failOrRetry(),
  });
};

export const useJobDelete = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<
    void,
    DefaultError,
    { id: NonNullable<Job["id"]>; no_rollback_if_file_not_deleted?: boolean }
  >({
    mutationFn: async ({
      id,
      no_rollback_if_file_not_deleted,
    }): Promise<void> => {
      const r = await axios.delete(api.v2`jobs/${id}`, {
        params: { user, no_rollback_if_file_not_deleted },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to delete job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Deleted",
        message: `Job has been deleted`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getJobsOfUserKey(orMe(user)),
      }).catch(log.error);
    },
  });
};

export const useJobCancel = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<void, DefaultError, { id: NonNullable<Job["id"]> }>({
    mutationFn: async ({ id }): Promise<void> => {
      toast.info({
        title: "FIXME: Not implemented",
        message: `Canceling job ${id}`,
      });
      // const r = await axios.post(api.v2`jobs/${id}/cancel`, null, {
      //   params: { user },
      // });
      // return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to cancel job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Canceled",
        message: `Job has been canceled`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getJobsOfUserKey(orMe(user)),
      }).catch(log.error);
    },
  });
};

export const useJobRepeat = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<void, DefaultError, { id: NonNullable<Job["id"]> }>({
    mutationFn: async ({ id }): Promise<void> => {
      toast.info({
        title: "FIXME: Not implemented",
        message: `Repeating job ${id}`,
      });
      // const r = await axios.post(api.v2`jobs/${id}/repeat`, null, {
      //   params: { user },
      // });
      // return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to repeat job");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Repeated",
        message: `Job has been repeated`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: getJobsOfUserKey(orMe(user)),
      }).catch(log.error);
    },
  });
};
