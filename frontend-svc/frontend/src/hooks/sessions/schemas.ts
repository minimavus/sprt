import { z } from "zod";

import { zodBool } from "@/utils/zodBool";
import { zodJSONString } from "@/utils/zodJSONString";
import { zodPagination } from "@/utils/zodPagination";
import { zodSort } from "@/utils/zodSort";
import { zodTime } from "@/utils/zodTime";

import { zodProto } from "../zodProto";

export const ServerWithSessionsSchema = z.object({
  server: z.string(),
  sessionscount: z.number(),
  friendly_name: z.string().nullable(),
  bulks: z
    .array(
      z.object({
        name: z.string().nullable(),
        sessions: z.number(),
      }),
    )
    .nullable(),
});

export type ServerWithSessions = z.infer<typeof ServerWithSessionsSchema>;

export const SessionsSummarySchema = z.object({
  radius: z.array(ServerWithSessionsSchema).nullable(),
  tacacs: z.array(ServerWithSessionsSchema).nullable(),
});

export type SessionsSummary = z.infer<typeof SessionsSummarySchema>;

const RadiusSessionAttributesSchema = z.looseObject({
  AcctPort: z.coerce.number(),
  AuthPort: z.coerce.number(),
  coa: z.looseObject({}).nullish(),
  DACL: z.any().nullish(),
  dns: z.string().nullish(),
  Dropped: zodBool,
  jid: z.string().nullish(),
  localAddr: z.string().nullish(),
  localPort: z.number().nullish(),
  proto: z.string().nullish(),
  Rfc3579MessageAuth: zodBool,
  snapshot: z
    .looseObject({
      GUEST_FLOW: z.string().or(z.looseObject({})).nullish(),
      SESSIONID: z.string().nullish(),
      IP: z.string().nullish(),
      OWNER: z.string().nullish(),
      MAC: z.string().nullish(),
    })
    .nullish(),
  StatesHistory: z.array(
    z.object({
      code: z.string(),
      time: z.number(),
    }),
  ),
  State: z.string().nullish(),
});

export const RadiusSessionSchema = z.object({
  attributes: RadiusSessionAttributesSchema.nullable(),
  bulk: z.string().nullish().default(""),
  changed: zodTime,
  class: z.string().nullish().default(""),
  id: z.any(),
  ipAddr: z.string().nullish().default(""),
  mac: z.string().nullish().default(""),
  owner: z.string(),
  RADIUS: zodJSONString,
  server: z.string().nullish().default(""),
  sessid: z.string().nullish().default(""),
  shared: z.string().nullish().default(""),
  started: zodTime,
  user: z.string().nullish().default(""),
});

export type RadiusSession = z.infer<typeof RadiusSessionSchema>;

export const RadiusSessionsInBulkSchema = z.object({
  sessions: z.array(RadiusSessionSchema).nullable(),
  _pagination: zodPagination,
  _sort: zodSort,
});

export type SessionsInBulk = z.infer<typeof RadiusSessionsInBulkSchema>;

const PacketTypeSchema = z
  .number()
  .transform((val) => (val === 1 ? "send" : val === 2 ? "receive" : "unknown"));

const PacketServerSchema = z
  .object({
    acct_port: z.coerce.number().nullish(),
    address: z.string().nullish(),
    auth_port: z.coerce.number().nullish(),
    dns: z.string().nullish(),
    family: z.string().nullish(),
    id: z.string().nullish(),
    local_addr: z.string().nullish(),
    local_port: z.coerce.number().nullish(),
    retransmits: z.coerce.number().nullish(),
    secret: z.string().nullish(),
    timeout: z.string().nullish(),
  })
  .catchall(z.any())
  .nullish();

const NameValueLowerCasedSchema = z
  .object({
    Name: z.string().nullish(),
    Value: z.union([z.string(), z.number()]).nullish(),
    name: z.string().nullish(),
    value: z.union([z.string(), z.number()]).nullish(),
  })
  .transform((val) => ({
    name: val.name || val.Name,
    value: val.value || val.Value,
  }));

const RadiusAttributeSchema = z
  .object({
    Name: z.string().nullish(),
    Value: z.union([z.string(), z.number()]).nullish(),
    Nested: z.array(NameValueLowerCasedSchema).nullish(),
    name: z.string().nullish(),
    value: z.union([z.string(), z.number()]).nullish(),
    nested: z.array(NameValueLowerCasedSchema).nullish(),
  })
  .transform((val) => ({
    name: val.name || val.Name,
    value: val.value || val.Value,
    nested: val.nested || val.Nested,
  }));

export type RadiusAttribute = z.infer<typeof RadiusAttributeSchema>;

const PacketSchema = z
  .object({
    code: z.string(),
    packet: z.array(RadiusAttributeSchema).or(z.looseObject({})).nullish(),
    server: PacketServerSchema,
    time: z.number(),
    formattedDateTime: z.string(),
    type: z.number(),
  })
  .catchall(z.any());

const FlowEntitySchema = z.object({
  session_id: z.number(),
  order: z.number(),
  radius: PacketSchema,
  packet_type: PacketTypeSchema,
  proto: zodProto,
});

export const FlowTypeSchema = z.enum([
  "radius-auth",
  "radius-acct",
  "radius-coa",
  "radius-disconnect",
  "radius-acl-download",
  "http",
  "tacacs-any",
  "out-of-order",
  "pxgrid",
]);

export type FlowType = z.infer<typeof FlowTypeSchema>;

export const SessionFlowSchema = z.object({
  type: FlowTypeSchema,
  packets: z.array(FlowEntitySchema),
});

export type SessionFlow = z.infer<typeof SessionFlowSchema>;

export const RadiusSessionDetailsSchema = RadiusSessionSchema.merge(
  z.object({
    flows: z.array(SessionFlowSchema).nullable(),
  }),
);

export type RadiusSessionDetails = z.infer<typeof RadiusSessionDetailsSchema>;

export const ProtoBulksSchema = z
  .array(ServerWithSessionsSchema)
  .nullable()
  .default([]);

export type ProtoBulks = z.infer<typeof ProtoBulksSchema>;

export const compactSessionSummarySchema = z.object({
  server: z.string().nullish(),
  id: z.number(),
  bulk: z.string().nullish(),
  owner: z.string(),
});

export type CompactSessionSummary = z.infer<typeof compactSessionSummarySchema>;

export enum TacacsSessionState {
  UNKNOWN = "UNKNOWN",
  INIT = "INIT",
  STARTED = "STARTED",
  ACCEPTED_AUTHZ = "ACCEPTED_AUTHZ",
  REJECTED_AUTHZ = "REJECTED_AUTHZ",
  ACCEPTED_ACCT = "ACCEPTED_ACCT",
  REJECTED_ACCT = "REJECTED_ACCT",
  ERROR_AUTHC = "ERROR_AUTHC",
  ERROR_AUTHZ = "ERROR_AUTHZ",
  ERROR_ACCT = "ERROR_ACCT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export const TacacsSessionStateSchema = z.enum(TacacsSessionState);

export const TacacsSessionSchema = z.object({
  id: z.coerce.number(),
  server: z.string(),
  user: z.string(),
  ip_addr: z.string(),
  shared: z.string(),
  started: zodTime,
  changed: zodTime,
  proto_data: z.object({
    auth: z.object({
      method: z.string(),
      attributes: z.record(z.string(), z.any()),
    }),
    authz: z
      .object({
        order: z.array(z.string()),
      })
      .catchall(
        z.looseObject({
          dly: z.number(),
          type: z.string(),
        }),
      ),
    commands: z
      .object({
        order: z.array(z.string()),
      })
      .catchall(
        z.object({
          name: z.string(),
          commands: z.array(z.looseObject({})),
        }),
      ),
  }),
  attributes: z.object({
    dns: z.string(),
    jid: z.string(),
    ports: z.array(z.coerce.number()),
    proto: z.string(),
    state: TacacsSessionStateSchema,
    Dropped: zodBool,
    snapshot: z.record(z.string(), z.any()),
    localAddr: z.string(),
    localPort: z.coerce.number(),
    StatesHistory: z.array(
      z.object({
        code: TacacsSessionStateSchema,
        time: zodTime,
      }),
    ),
  }),
  owner: z.string(),
  bulk: z.string(),
});

export type TacacsSession = z.infer<typeof TacacsSessionSchema>;

export const TacacsSessionsInBulkSchema = z.object({
  sessions: z.array(TacacsSessionSchema).nullable(),
  _pagination: zodPagination,
  _sort: zodSort,
});

export type TacacsSessionsInBulk = z.infer<typeof TacacsSessionsInBulkSchema>;

export const TacacsSessionDetailsSchema = TacacsSessionSchema.merge(
  z.object({
    flows: z.array(SessionFlowSchema).nullable(),
  }),
);

export type TacacsSessionDetails = z.infer<typeof TacacsSessionDetailsSchema>;

export const TacacsPacketSchema = z.object({
  body: z.record(z.string(), z.any()).nullable(),
  header: z.record(z.string(), z.any()).nullable(),
});

export type TacacsPacket = z.infer<typeof TacacsPacketSchema>;
