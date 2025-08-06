import {
  type DefaultError,
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn, useGetQuery } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { noNull } from "@/utils/noNull";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";
import { zodPagination } from "@/utils/zodPagination";

export const RDNOrder = ["cn", "ou", "o", "l", "st", "c", "dc"] as const;

export const SANKeysOrder = [
  "rfc822Name",
  "dNSName",
  "x400Address",
  "directoryName",
  "uniformResourceIdentifier",
  "iPAddress",
] as const;

const AllowedSANKeysSchema = z.enum(SANKeysOrder);

export const SANSchema = z
  .object({})
  .catchall(z.array(z.string()))
  .refine((value) => {
    return Object.keys(value).every((k) => AllowedSANKeysSchema.safeParse(k));
  });

export const CertTemplateContentSchema = z.looseObject({
  san: SANSchema,
  subject: z.object({}).catchall(z.array(z.string())),
  key_type: z.enum(["rsa", "ecdsa"]).optional(),
  key_usage: z.object({
    cRLSign: z.boolean().optional().default(false),
    keyCertSign: z.boolean().optional().default(false),
    decipherOnly: z.boolean().optional().default(false),
    encipherOnly: z.boolean().optional().default(false),
    keyAgreement: z.boolean().optional().default(false),
    nonRepudiation: z.boolean().optional().default(false),
    keyEncipherment: z.boolean().optional().default(false),
    dataEncipherment: z.boolean().optional().default(false),
    digitalSignature: z.boolean().optional().default(false),
  }),
  key_length: z.number().optional(),
  e_curve: z
    .enum(["P-224", "P-256", "P-384", "P-521"])
    .default("P-256")
    .optional(),
  ext_key_usage: z.object({
    clientAuth: z.boolean().optional().default(false),
    serverAuth: z.boolean().optional().default(false),
    codeSigning: z.boolean().optional().default(false),
    timeStamping: z.boolean().optional().default(false),
    emailProtection: z.boolean().optional().default(false),
  }),
});

export const CertTemplateSchema = z.object({
  id: z.string(),
  owner: z.string().nullable().transform(noNull),
  friendly_name: z.string().nullable().transform(noNull),
  content: CertTemplateContentSchema.nullish(),
  subject: z.string().nullable().transform(noNull),
});

export type CertTemplate = z.infer<typeof CertTemplateSchema>;

const CertTemplatesResponseSchema = z.object({
  templates: z.array(CertTemplateSchema).nullable(),
  _pagination: zodPagination,
});

const getCertTemplatesKey = (user: string): QueryKey => [
  "certificates",
  "templates",
  user,
];

type UseCertTemplatesOptions = {
  user?: QueryUser;
};

export function useCertTemplates({ user }: UseCertTemplatesOptions = {}) {
  return useGetQuery({
    url: api.v2`certificates/templates`,
    schema: CertTemplatesResponseSchema,
    queryKey: getCertTemplatesKey(orMe(user)),
    params: { user },
    mapper(value) {
      return value?.templates ?? [];
    },
  });
}

export const getCertTemplateKey = (user: string, id: string): QueryKey => [
  "certificates",
  "templates",
  user,
  id,
];

export const getCertTemplateKeyAndEnsureDefaults = (
  user: string | null | undefined,
  id: string,
) => {
  const queryKey = getCertTemplateKey(orMe(user), id);

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/certificates/templates/${id}`,
        schema: CertTemplateSchema,
        params: { user },
      }),
    });
  }

  return queryKey;
};

type CertTemplateUpsertVariables = Pick<
  CertTemplate,
  "id" | "content" | "friendly_name"
> & { user?: string };

export const useCertTemplateUpsert = () => {
  const qc = useQueryClient();

  return useMutation<unknown, DefaultError, CertTemplateUpsertVariables>({
    mutationFn: async ({ id, user, ...body }) => {
      if (id) {
        await axios.put(api.v2`certificates/templates/${id}`, body, {
          params: { user },
        });
      } else {
        await axios.post(api.v2`certificates/templates`, body, {
          params: { user },
        });
      }
    },
    onSuccess: () => {
      toast.success({
        title: "Success",
        message: "Certificate template saved successfully",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSettled: (_d, _err, variables) => {
      if (variables.id) {
        qc.resetQueries({
          queryKey: getCertTemplateKey(orMe(variables.user), variables.id),
        }).catch(log.error);
      }
      qc.invalidateQueries({
        queryKey: getCertTemplatesKey(orMe(variables.user)),
      }).catch(log.error);
    },
  });
};

export const useCertTemplateDelete = () => {
  const qc = useQueryClient();

  return useMutation<unknown, DefaultError, { id: string[]; user?: QueryUser }>(
    {
      mutationFn: async ({ id, user }) => {
        if (id.length === 1) {
          await axios.delete(api.v2`certificates/templates/${id[0]}`, {
            params: { user },
          });
        } else {
          await axios.delete(api.v2`certificates/templates`, {
            params: { user },
            data: { ids: id },
          });
        }
      },
      onSuccess: (_d, { id }) => {
        toast.success({
          title: "Deleted",
          message: `Certificate template${id.length > 1 ? "s" : ""} deleted`,
        });
      },
      onError: (error) => {
        toast.error({
          title: "Error",
          message: getErrorMessage(error),
        });
      },
      onSettled: (_d, _err, variables) => {
        qc.invalidateQueries({
          queryKey: getCertTemplatesKey(orMe(variables.user)),
        }).catch(log.error);
        for (const id of variables.id) {
          qc.removeQueries({
            queryKey: getCertTemplateKey(orMe(variables.user), id),
          });
        }
      },
    },
  );
};
