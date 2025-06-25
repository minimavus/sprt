import {
  useMutation,
  useQueryClient,
  type DefaultError,
  type QueryKey,
} from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { z } from "zod/v4";

import { useGetQuery } from "@/hooks/useGetQuery";
import { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

const dictionaryTypesKey: QueryKey = ["settings", "dictionary-types"];

const DictionaryTypeSchema = z.object({ name: z.string(), title: z.string() });

export type DictionaryType = z.infer<typeof DictionaryTypeSchema>;

const DictionaryTypesSchema = z.array(DictionaryTypeSchema);

export const useDictionaryTypes = () => {
  return useGetQuery({
    url: api.v2`settings/dictionary-types`,
    queryKey: dictionaryTypesKey,
    schema: DictionaryTypesSchema,
  });
};

const getDictionariesOfTypeKey = (
  type: string,
  withGlobals: boolean | null,
  user: QueryUser,
): QueryKey =>
  withGlobals === null
    ? ["settings", "dictionaries", type, user]
    : ["settings", "dictionaries", type, user, { withGlobals }];

const DictionaryMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  owner: z.string(),
  type: z.string(),
  is_global: z.boolean(),
});

export type DictionaryMeta = z.infer<typeof DictionaryMetaSchema>;

const DictionariesOfTypeResponseSchema = z.array(DictionaryMetaSchema);

export const useDictionariesOfType = (
  type: string,
  include_global?: boolean,
  user?: QueryUser,
) => {
  return useGetQuery({
    url: api.v2`settings/dictionaries`,
    queryKey: type
      ? getDictionariesOfTypeKey(type, Boolean(include_global), orMe(user))
      : undefined,
    schema: DictionariesOfTypeResponseSchema,
    params: { type, include_global, user },
  });
};

export const useDictionaryDelete = () => {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    DefaultError,
    { id: string; user?: QueryUser; type: string }
  >({
    mutationFn: async ({ id, user }) => {
      const r = await axios.delete(api.v2`settings/dictionaries/${id}`, {
        params: { user },
      });
      return r.data;
    },
    onSettled: (_data, _error, { type, user, id }) => {
      qc.invalidateQueries({
        queryKey: getDictionariesOfTypeKey(type, null, orMe(user)),
      }).catch(log.error);
      qc.invalidateQueries({ queryKey: getDictionaryByIDKey(id) }).catch(
        log.error,
      );
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: () => {
      toast.success({
        title: "Deleted",
        message: "Dictionary deleted",
      });
    },
  });
};

const getDictionaryByIDKey = (id: string): QueryKey => [
  "settings",
  "dictionaries",
  id,
];

const FullDictionarySchema = DictionaryMetaSchema.merge(
  z.object({
    content: z
      .string()
      .nullable()
      .transform((v) => (v === undefined || v === null ? "" : v)),
  }),
);

export type FullDictionary = z.infer<typeof FullDictionarySchema>;

export const useDictionaryByID = (id: string, user: QueryUser) => {
  return useGetQuery({
    url: api.v2`settings/dictionaries/${id}`,
    queryKey: getDictionaryByIDKey(id),
    schema: FullDictionarySchema,
    params: { user },
  });
};

export const useDictionaryByName = (name: string, user: QueryUser) => {
  return useGetQuery({
    url: api.v2`settings/dictionaries/${name}`,
    queryKey: name ? getDictionaryByIDKey(name) : undefined,
    schema: FullDictionarySchema,
    params: { by_name: true, user },
  });
};

export const useDictionaryUpsert = () => {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    DefaultError,
    PartialBy<FullDictionary, "is_global" | "id"> & {
      user?: QueryUser;
    }
  >({
    mutationFn: async ({ id, user, ...values }) => {
      if ("is_global" in values) {
        delete values["is_global"];
      }

      let r: AxiosResponse;
      if (!id) {
        r = await axios.post(api.v2`settings/dictionaries`, values, {
          params: { user },
        });
      } else {
        r = await axios.put(api.v2`settings/dictionaries/${id}`, values, {
          params: { user },
        });
      }

      return r.data;
    },
    onSettled: (_data, _error, { type, user }) => {
      qc.invalidateQueries({
        queryKey: getDictionariesOfTypeKey(type, null, orMe(user)),
      }).catch(log.error);
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: ({ id: newId }, { id }) => {
      qc.removeQueries({ queryKey: getDictionaryByIDKey(newId) });
      toast.success({
        title: id ? "Updated" : "Created",
        message: `Dictionary saved`,
      });
    },
  });
};
