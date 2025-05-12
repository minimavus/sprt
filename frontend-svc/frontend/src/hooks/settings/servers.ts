import {
  useMutation,
  useQueryClient,
  type DefaultError,
  type QueryKey,
} from "@tanstack/react-query";
import axios from "axios";
import { z, type RefinementCtx } from "zod";

import { useGetQuery } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { isIP } from "@/utils/ip";
import { log } from "@/utils/log";
import { noNull } from "@/utils/noNull";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import { QueryUser } from "../useQueryUser";

export const getServersSettingsKey = (user: string): QueryKey => [
  "settings",
  "servers",
  user,
];

export const getServerSettingsKey = (id: string, user: string): QueryKey => [
  "settings",
  "servers",
  user,
  id,
];

export const NoSessionActionValues = ["coa-ack", "coa-nak", "drop"] as const;
export const NoSessionDmActionValues = [
  "disconnect-ack",
  "disconnect-nak",
] as const;

const NoSessionDmActionSchema = z.enum(NoSessionDmActionValues);
const NoSessionAction = z.enum(NoSessionActionValues);

export const ErrCauseList = [
  { code: "group", explain: "Successful completion" },
  { code: "201", explain: "201 - Residual Session Context Removed" },
  { code: "202", explain: "202 - Invalid EAP Packet (Ignored)" },

  { code: "group", explain: "Fatal errors committed by the RADIUS server" },
  { code: "401", explain: "401 - Unsupported Attribute" },
  { code: "402", explain: "402 - Missing Attribute" },
  { code: "403", explain: "403 - NAS Identification Mismatch" },
  { code: "404", explain: "404 - Invalid Request" },
  { code: "405", explain: "405 - Unsupported Service" },
  { code: "406", explain: "406 - Unsupported Extension" },
  { code: "407", explain: "407 - Invalid Attribute Value" },

  { code: "group", explain: "Fatal errors occurring on a NAS" },
  { code: "501", explain: "501 - Administratively Prohibited" },
  { code: "502", explain: "502 - Request Not Routable (Proxy)" },
  { code: "503", explain: "503 - Session Context Not Found" },
  { code: "504", explain: "504 - Session Context Not Removable" },
  { code: "505", explain: "505 - Other Proxy Processing Error" },
  { code: "506", explain: "506 - Resources Unavailable" },
  { code: "507", explain: "507 - Request Initiated" },
  { code: "508", explain: "508 - Multiple Session Selection Unsupported" },

  { code: "group", explain: "Other" },
  { code: "000", explain: "Don't send Error-Cause" },
] as const;

export type ErrCause = Exclude<(typeof ErrCauseList)[number]["code"], "group">;

const ErrCauseSchema = z.enum<ErrCause, [ErrCause, ...ErrCause[]]>(
  ErrCauseList.map((e) => e.code).filter((e) => e !== "group") as [
    ErrCause,
    ...ErrCause[],
  ],
);

const PortSchema = z.number().positive().lte(65535);

const portRefinement = (v: unknown, ctx: RefinementCtx) => {
  if (v === undefined) return;
  const p = PortSchema.safeParse(v);
  if (!p.success) {
    for (const i of p.error.issues) {
      ctx.addIssue(i);
    }
    return z.NEVER;
  }
};

const ServerAttributesSchema = z.object({
  dns: z.string().refine(isIP({ allowEmpty: true, allowUndef: true })),
  tac: z
    .object({
      ports: z.array(PortSchema).nullish(),
      shared: z.string().nullish().transform(noNull),
    })
    .nullish()
    .transform(noNull),
  radius: z.coerce.boolean(),
  shared: z.string(),
  tacacs: z.coerce.boolean(),
  resolved: z
    .string()
    .nullish()
    .transform(noNull)
    .refine(isIP({ allowEmpty: true, allowUndef: true })),
  v6_address: z
    .string()
    .nullish()
    .transform(noNull)
    .refine(isIP({ allowEmpty: true, allowUndef: true, version: "v6" })),
  dm_err_cause: ErrCauseSchema.nullish().transform(noNull),
  friendly_name: z.string().nullish().transform(noNull),
  coa_nak_err_cause: ErrCauseSchema.nullish().transform(noNull),
  no_session_action: NoSessionAction.nullish().transform(noNull),
  no_session_dm_action: NoSessionDmActionSchema.nullish().transform(noNull),
});

const BaseServerSettingsSchema = z.object({
  coa: z.coerce.boolean(),
  group: z.string(),
  owner: z.string(),
  acct_port: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .superRefine(portRefinement),

  address: z.string().ip(),
  auth_port: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .superRefine(portRefinement),
  attributes: ServerAttributesSchema.nullish().default({
    dns: "",
    radius: false,
    shared: "",
    tacacs: false,
  }),
});

const refineServer = (v: any, ctx: RefinementCtx) => {
  if (v.attributes?.radius) {
    if (!v.auth_port)
      ctx.addIssue({
        code: "custom",
        path: ["auth_port"],
        message: "Required",
      });
    if (!v.acct_port)
      ctx.addIssue({
        code: "custom",
        path: ["acct_port"],
        message: "Required",
      });
    if (!v.attributes.shared)
      ctx.addIssue({
        code: "custom",
        path: ["attributes", "shared"],
        message: "Required",
      });
  }
  if (v.attributes?.tacacs) {
    if (!v.attributes.tac?.ports?.length)
      ctx.addIssue({
        code: "custom",
        path: ["attributes", "tac", "ports"],
        message: "At least one port is required",
      });
    if (!v.attributes.tac?.shared)
      ctx.addIssue({
        code: "custom",
        path: ["attributes", "tac", "shared"],
        message: "Required",
      });
  }
};

export const ServerSettingsSchema = BaseServerSettingsSchema.merge(
  z.object({ id: z.string().uuid() }),
).superRefine(refineServer);

export const NewServerSchema =
  BaseServerSettingsSchema.superRefine(refineServer);
export type NewServer = z.infer<typeof NewServerSchema>;

export type ServerSettings = z.infer<typeof ServerSettingsSchema>;

const getServersPlainResponseSchema = z.object({
  servers: z.array(ServerSettingsSchema),
});

type ServersPlainResponse = z.infer<typeof getServersPlainResponseSchema>;

// const getServersGroupedResponseSchema = z.object({
//   servers: z.object({}).catchall(z.array(ServerSettingsSchema)),
// });

export function useServersSettings(user?: QueryUser) {
  return useGetQuery({
    url: api.v2`settings/servers`,
    schema: getServersPlainResponseSchema,
    queryKey: getServersSettingsKey(orMe(user)),
    mapper: (value) => value.servers,
    params: { user },
    refetchInterval: Infinity,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: Infinity,
  });
}

export function useServerSettings(id: string | undefined, user: QueryUser) {
  const qc = useQueryClient();

  return useGetQuery({
    url: api.v2`settings/servers/${id ?? ""}`,
    schema: ServerSettingsSchema,
    queryKey: id ? getServerSettingsKey(id, orMe(user)) : undefined,
    params: { user },
    placeholderData: qc
      .getQueryData<ServersPlainResponse>(getServersSettingsKey(orMe(user)))
      ?.servers?.find((s) => s.id === id) as any,
  });
}

export function useServerSettingsDelete(user: QueryUser) {
  const qc = useQueryClient();
  return useMutation<
    { deleted: number },
    DefaultError,
    Pick<ServerSettings, "id">
  >({
    mutationFn: async ({ id }): Promise<{ deleted: number }> => {
      const r = await axios.delete(api.v2`settings/servers/${id}`, {
        params: { user },
      });
      return r.data;
    },
    onError: (error) => {
      log.error(error, "Failed to delete server");
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data, { id }) => {
      toast.success({
        title: "Deleted",
        message: `Server deleted.${
          data?.deleted ? ` Rows deleted: ${data.deleted}` : ""
        }`,
      });
      qc.removeQueries({
        queryKey: getServerSettingsKey(id, orMe(user)),
      });
      qc.invalidateQueries({
        queryKey: getServersSettingsKey(orMe(user)),
      }).catch(log.error);
    },
  });
}

export const useServerSettingsUpsert = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    DefaultError,
    Omit<ServerSettings, "id"> & { id: string | undefined }
  >({
    mutationFn: async ({ id, ...server }) => {
      return (
        await (id
          ? axios.put(
              api.v2`settings/servers/${id}`,
              { server },
              { params: { user } },
            )
          : axios.post(
              api.v2`settings/servers`,
              { server },
              { params: { user } },
            ))
      ).data;
    },
    onError: (error, { id }) => {
      log.error(
        error,
        id ? "Failed to update server" : "Failed to create server",
      );
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess: (data, { id }) => {
      toast.success({
        title: id ? "Updated" : "Created",
        message: id ? "Server updated." : "Server created",
      });
      if (id)
        qc.invalidateQueries({
          queryKey: getServerSettingsKey(id, orMe(user)),
        }).catch(log.error);
      if (data?.id)
        qc.invalidateQueries({
          queryKey: getServerSettingsKey(data.id, orMe(user)),
        }).catch(log.error);
      qc.invalidateQueries({
        queryKey: getServersSettingsKey(orMe(user)),
      }).catch(log.error);
    },
  });
};
