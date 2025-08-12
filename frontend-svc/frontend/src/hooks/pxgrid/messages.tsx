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

import { pxGridMessagesSchema } from "./schemas";

const getPxGridConnectionMessagesKey = (id: string, user: string): QueryKey => [
  "pxgrid",
  "connections",
  user,
  { id },
  "messages",
];

const getPaginatedPxGridConnectionMessagesKey = (
  id: string,
  user: string,
  pagination: PaginationRequest,
): QueryKey => getPxGridConnectionMessagesKey(id, user).concat([pagination]);

export const usePxGridConnectionMessages = (
  id: string,
  user: string | null | undefined,
  pagination: PaginationRequest,
) => {
  const queryKey = getPaginatedPxGridConnectionMessagesKey(
    id,
    orMe(user),
    pagination,
  );
  return useGetQuery({
    url: api.v2`/pxgrid/connections/${id}/messages`,
    schema: pxGridMessagesSchema,
    queryKey,
    params: { ...pagination, user },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
};

export const usePxGridConnectionMessagesDelete = (
  id: string,
  user?: QueryUser,
) => {
  return useMutation<
    unknown,
    DefaultError,
    { all: true } | { all: false; ids: number[] }
  >({
    mutationFn: async (variables) => {
      const r = await axios.delete(api.v2`/pxgrid/connections/${id}/messages`, {
        data: variables,
        params: { user },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to delete messages");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        message: "Messages deleted",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getPxGridConnectionMessagesKey(id, orMe(user)),
      });
    },
  });
};

export type OnDeleteMessages = ReturnType<
  typeof usePxGridConnectionMessagesDelete
>["mutateAsync"];
