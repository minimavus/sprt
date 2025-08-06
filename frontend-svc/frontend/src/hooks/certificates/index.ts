import {
  type DefaultError,
  keepPreviousData,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, {
  type AxiosError,
  type AxiosProgressEvent,
  type AxiosRequestConfig,
  isAxiosError,
  type RawAxiosRequestHeaders,
} from "axios";
import { saveAs } from "file-saver";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import failOrRetry from "@/utils/failOrRetry";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";
import { zodPagination } from "@/utils/zodPagination";
import { zodTime } from "@/utils/zodTime";

import { queryClient } from "../queryClient";
import { queryGetFn } from "../useGetQuery";

interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}
type UploadRequestMethod = "POST" | "PUT" | "PATCH" | "post" | "put" | "patch";
type UploadRequestHeader = Record<string, string>;
export interface UploadRequestError extends Error {
  status?: number;
  method?: UploadRequestMethod;
  url?: string;
}
interface UploadRequestOption<T = any> {
  onProgress?: (event: UploadProgressEvent, file?: File) => void;
  onError?: (event: UploadRequestError | ProgressEvent, body?: T) => void;
  onSuccess?: (body: T, fileOrXhr?: File | XMLHttpRequest) => void;
  data?: Record<string, unknown>;
  filename?: string;
  file: File | string;
  withCredentials?: boolean;
  headers?: UploadRequestHeader;
}

const CertTypeSchema = z.enum(["identity", "trusted", "signer"]);

export type CertType = z.infer<typeof CertTypeSchema>;

const getCertificatesByTypeKey = ({
  type,
  user,
}: {
  type: CertType;
  user?: QueryUser;
}): QueryKey => ["certificates", orMe(user), type];

const CertKeysSchema = z.object({
  type: z.string().nullish(),
  public: z.string(),
  private: z.string().nullish(),
});

const DecodedCertSchema = z.object({
  aki: z.string(),
  basicConstraints: z.object({
    critical: z.boolean(),
    isCA: z.boolean(),
    maxPathLen: z.number(),
    maxPathLenZero: z.boolean(),
    valid: z.boolean(),
  }),
  extKeyUsage: z.string().array().nullable(),
  isRoot: z.boolean(),
  issuer: z.string(),
  keyUsage: z.object({
    critical: z.boolean(),
    usage: z.string().array().nullable(),
  }),
  notAfter: zodTime,
  notBefore: zodTime,
  isExpired: z.boolean(),
  pubKey: z.object({
    algo: z.string(),
    size: z.number(),
  }),
  san: z.object({
    dnsNames: z.array(z.any()).nullable(),
    emailAddresses: z.array(z.any()).nullable(),
    ipAddresses: z.array(z.any()).nullable(),
    uris: z.array(z.any()).nullable(),
  }),
  serial: z.string(),
  signature: z.string(),
  ski: z.string(),
  subject: z.string(),
  version: z.number(),
});

export const baseCertificateSchema = z.object({
  id: z.string().uuid(),
  owner: z.string(),
  friendly_name: z.string().nullable(),
  type: CertTypeSchema,
  content: z.string().optional(),
  keys: CertKeysSchema.nullable().optional(),
  subject: z.string().nullable(),
  serial: z.string().nullable(),
  thumbprint: z.string().nullable(),
  issuer: z.string().nullable(),
  valid_from: zodTime.nullable(),
  valid_to: zodTime.nullable(),
  self_signed: z.boolean().nullable(),
  decoded: DecodedCertSchema.optional(),
  decode_error: z.string().optional(),
  is_expired: z.boolean(),
  body: z.string().optional(),
});

export type Certificate = z.infer<typeof baseCertificateSchema> & {
  chain?: Certificate;
};

const CertificateSchema: z.ZodType<Certificate> = baseCertificateSchema.extend({
  chain: z.lazy(() => CertificateSchema.optional()),
}) as z.ZodType<Certificate>;

const getCertificatesByTypeResponseSchema = z.object({
  certificates: z.array(CertificateSchema),
  _pagination: zodPagination,
});

export type CertificatesByTypeResponse = z.infer<
  typeof getCertificatesByTypeResponseSchema
>;

export const getCertificatesOfTypeKeyAndEnsureDefaults = (
  type: CertType,
  user: QueryUser,
) => {
  const queryKey = getCertificatesByTypeKey({ type, user: orMe(user) });

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`certificates/${type}`,
        params: { user },
        schema: getCertificatesByTypeResponseSchema,
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
      placeholderData: keepPreviousData,
    });
  }

  return queryKey;
};

export const useCertificatesOfType = (
  type: CertType,
  { user }: { user?: QueryUser },
) => {
  const queryKey = getCertificatesOfTypeKeyAndEnsureDefaults(type, user);
  return useQuery<unknown, DefaultError, CertificatesByTypeResponse>({
    queryKey,
  });
};

type CertByIdProps = {
  id: string;
  user?: QueryUser;
  include_chain?: boolean;
  type: CertType;
};

const getCertificateByIdKey = ({ user, ...props }: CertByIdProps): QueryKey => [
  "certificates",
  orMe(user),
  props,
];

export const useCertificate = ({
  user,
  id,
  include_chain,
  type,
}: CertByIdProps) => {
  return useQuery({
    queryKey: getCertificateByIdKey({
      user,
      id,
      include_chain,
      type,
    }),
    queryFn: async ({ signal }) => {
      const r = await axios.get(api.v2`certificates/${type}/${id}`, {
        params: { user, include_chain },
        signal,
      });

      return CertificateSchema.parse(r.data);
    },
  });
};

export type CertID = {
  id: string;
  type: CertType;
};

export type CertExportOptions = {
  what: "cert" | "cert-with-key";
  pass?: string;
  include_chain: boolean;
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
};

export const useCertificatesExport = () => {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cb = useCallback(
    async (ids: CertID[], options: CertExportOptions, user: QueryUser) => {
      setFetching(true);
      setError(null);

      try {
        const r = await axios.post(
          api.v2`certificates/export`,
          {
            ids,
            options,
          },
          { params: { user } },
        );

        const disposition = r.headers["content-disposition"];
        const filename = disposition
          ? disposition.split("filename=")[1]
          : "certificates.tar";
        const contentType = r.headers["content-type"];

        saveAs(new Blob([r.data], { type: contentType }), filename);

        if (options.onSuccess) {
          options.onSuccess();
        }
      } catch (e) {
        setError(e as any);
        if (options.onError) {
          options.onError(e);
        }
      } finally {
        setFetching(false);
      }
    },
    [],
  );

  return useMemo(
    () => ({ fetching, error, exportAsync: cb }),
    [fetching, error, cb],
  );
};

export const useCertificatesDelete = () => {
  const qc = useQueryClient();

  return useMutation<
    { [x in CertType]: number },
    DefaultError,
    { ids: CertID[]; user: QueryUser }
  >({
    mutationFn: async ({ ids, user }) => {
      const deleted = { identity: 0, trusted: 0, signer: 0 };

      for (const type of ["identity", "trusted", "signer"] as const) {
        const idsOfType = ids
          .filter((id) => id.type === type)
          .map((id) => id.id);
        if (idsOfType.length === 0) {
          continue;
        }

        const r = await axios.delete<{ deleted: number }>(
          api.v2`certificates/${type}`,
          {
            data: { ids: idsOfType },
            params: { user },
          },
        );

        deleted[type] = r.data.deleted;
      }

      return deleted;
    },
    onSuccess: (data, variables) => {
      let total = 0;
      for (const [k, v] of Object.entries(data)) {
        if (v === 0) {
          continue;
        }

        total += v;

        qc.invalidateQueries({
          queryKey: getCertificatesByTypeKey({
            type: k as CertType,
            user: variables.user,
          }),
        }).catch(log.error);
      }

      toast.success({
        title: "Deleted",
        message: `Deleted ${total} certificate${total === 1 ? "" : "s"}`,
      });
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
  });
};

export const useCertificateUpdate = () => {
  const qc = useQueryClient();

  return useMutation<
    unknown,
    DefaultError,
    {
      id: string;
      type: CertType;
      user: QueryUser;
      data: { name: string };
    }
  >({
    mutationFn: async ({ id, user, data, type }) => {
      const r = await axios.patch<Certificate>(
        api.v2`certificates/${type}/${id}`,
        data,
        {
          params: { user },
        },
      );

      return r.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: getCertificateByIdKey({
          id: variables.id,
          user: variables.user,
          type: variables.type,
        }),
      }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getCertificatesByTypeKey({
          type: variables.type,
          user: variables.user,
        }),
      }).catch(log.error);

      toast.success({
        title: "Updated",
        message: "Certificate updated",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
  });
};

interface ExtendedUploadRequestError extends UploadRequestError {
  details?: unknown;
}

export const isExtendedUploadRequestError = (
  e: unknown,
): e is ExtendedUploadRequestError => {
  return (
    e instanceof Object &&
    "name" in e &&
    "message" in e &&
    "status" in e &&
    "method" in e &&
    "url" in e &&
    "details" in e
  );
};

function ExtendedUploadRequestErrorFromAxiosError(
  e: AxiosError,
): ExtendedUploadRequestError {
  return {
    name: e.name,
    message: e.message,
    status: e.response?.status,
    method: (e.config?.method || "POST") as UploadRequestMethod,
    url: e.config?.url,
    details: e.response?.data,
  };
}

export const useCertificateUpload = ({
  user,
  type,
}: {
  user: QueryUser;
  type: CertType;
}) => {
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async ({
      onSuccess,
      onError,
      file,
      onProgress,
      data: originalData,
    }: Omit<UploadRequestOption, "action" | "method">) => {
      let data: FormData | Record<string, unknown>,
        headers: RawAxiosRequestHeaders;

      if (typeof file === "string") {
        data = { pem: file };
        if (originalData) {
          data = { ...data, ...originalData };
        }
        headers = {
          "Content-Type": "application/json",
        };
      } else {
        data = new FormData();
        (data as FormData).append("file", file as File);
        if (originalData) {
          for (const [k, v] of Object.entries(originalData)) {
            (data as FormData).append(k, v as string);
          }
        }
        headers = {
          "Content-Type": "multipart/form-data",
        };
      }

      const config: AxiosRequestConfig<FormData> = {
        onUploadProgress: (e: AxiosProgressEvent) => {
          const percent = Math.round((e.loaded * 100) / (e.total ?? 1));
          setProgress(percent);
          onProgress?.({ percent });
        },
        headers,
        params: { user },
      };

      try {
        const r = await axios.post(api.v2`certificates/${type}`, data, config);

        onSuccess?.(r.data);
        qc.invalidateQueries({
          queryKey: getCertificatesByTypeKey({
            type,
            user,
          }),
        }).catch(log.error);
        toast.success({
          title: "Uploaded",
          message: "Certificate uploaded",
        });
      } catch (e) {
        if (isAxiosError(e)) {
          onError?.(ExtendedUploadRequestErrorFromAxiosError(e));
        } else {
          onError?.({
            name: "UnknownError",
            message: "Something went wrong",
            method: "POST",
            url: api.v2`certificates/${type}`,
          });
        }

        toast.error({
          title: "Error",
          message: getErrorMessage(e),
        });
      } finally {
        setProgress(0);
      }
    },
    [qc, type, user],
  );

  return { upload, progress };
};
