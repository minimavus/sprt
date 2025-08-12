import {
  type DefaultError,
  keepPreviousData,
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
import type { PaginationRequest } from "@/utils/zodPagination";

import { pxGridLogsSchema } from "./schemas";

const getPxGridConnectionLogsKey = (id: string, user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { id },
  "logs",
];

const getPaginatedPxGridConnectionLogsKey = (
  id: string,
  user: string,
  pagination: PaginationRequest,
): QueryKey => getPxGridConnectionLogsKey(id, user).concat([pagination]);

export const usePxGridConnectionLogs = (
  id: string,
  user: string | null | undefined,
  pagination: PaginationRequest,
) => {
  const queryKey = getPaginatedPxGridConnectionLogsKey(
    id,
    orMe(user),
    pagination,
  );
  return useGetQuery({
    url: api.v2`/pxgrid/connections/${id}/logs`,
    schema: pxGridLogsSchema,
    queryKey,
    params: { ...pagination, user },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
};

export const usePxGridConnectionLogsCleanup = (
  id: string,
  user?: QueryUser,
) => {
  return useMutation<unknown, DefaultError, void>({
    mutationFn: async () => {
      const r = await axios.delete(api.v2`/pxgrid/connections/${id}/logs`, {
        data: { all: true },
        params: { user },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to delete logs");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        message: "Logs deleted",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getPxGridConnectionLogsKey(id, orMe(user)),
      });
    },
  });
};

export type OnCleanupLogs = ReturnType<
  typeof usePxGridConnectionLogsCleanup
>["mutateAsync"];
