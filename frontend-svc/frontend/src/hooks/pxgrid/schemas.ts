import { z } from "zod";

import { zodJSONString } from "@/utils/zodJSONString";
import { zodTime } from "@/utils/zodTime";

export const pxGridStatusSchema = z.object({
  enabled: z.boolean(),
  healthy: z.boolean(),
  error: z.string().optional(),
});

export type PxGridStatus = z.infer<typeof pxGridStatusSchema>;

const pxGridConnectionNode = z.object({
  fqdn: z.string(),
  control_port: z.number(),
});

export enum FamilyPreference {
  IPv4 = 0,
  IPv6 = 1,
  IPv4AndIPv6 = 2,
  IPv6AndIPv4 = 3,
}

const dnsDetails = z.object({
  dns: z.object({
    ip: z.string(),
    port: z.number(),
  }),
  strategy: z.nativeEnum(FamilyPreference).optional(),
});

export enum CredentialsType {
  Unspecified = 0,
  Password = 1,
  Certificate = 2,
}

const pxGridCredentials = z.object({
  type: z.nativeEnum(CredentialsType),
  node_name: z.string().optional(),
  Kind: z.union([
    z.object({
      Password: z.object({
        password: z.string().optional(),
      }),
    }),
    z.object({
      Certificate: z.object({
        private_key: z.string().optional(),
        certificate: z.string().optional(),
        ca_certificates: z.array(z.string()).optional(),
      }),
    }),
  ]),
});

// const callParam = z.object({
//   name: z.string(),
//   type: z.string(),
//   value: z.string(),
// });

// const call = z.object({
//   call: z.string(),
//   wiki: z.string(),
//   params: z.array(callParam).optional().default([]),
// });

// const serviceNode = z.object({
//   name: z.string(),
//   node_name: z.string(),
//   properties: z.record(z.string(), z.string()),
// });

// const pxService = z.object({
//   calls: z.array(call).optional(),
//   services: z.array(serviceNode).optional().default([]),
// });

// const subscription = z.object({
//   pubsub: z.string().optional(),
//   destination: z.string().optional(),
//   connected: z.boolean().optional().default(false),
//   nodes: z.array(z.string()).optional().default([]),
// });

// const topicMap = z.object({
//   subscriptions: z.record(z.string(), subscription).optional().default({}),
// });

const pxGridConnectionState = z.enum([
  "PENDING",
  "DISABLED",
  "ENABLED",
  "UNKNOWN",
]);

export const pxGridConnectionSchema = z.object({
  id: z.string(),
  friendly_name: z.string(),
  nodes: z.array(pxGridConnectionNode),
  credentials: pxGridCredentials,
  state: pxGridConnectionState.optional().default("UNKNOWN"),
  description: z.string().optional(),
  client_name: z.string(),
  owner: z.object({
    uid: z.string(),
  }),
  dns_details: dnsDetails.optional(),
  // services: z.record(z.string(), pxService).optional().default({}),
  // topics: z.record(z.string(), topicMap).optional().default({}),
});

export type PxGridConnection = z.infer<typeof pxGridConnectionSchema>;

export const pxGridConnectionsSchema = z.object({
  connections: z.array(pxGridConnectionSchema).optional().default([]),
});

export type PxGridConnections = z.infer<typeof pxGridConnectionsSchema>;

export enum IPFamily {
  IPv4 = 0,
  IPv6 = 1,
}

const ipSchema = z.object({
  ip: z.string(),
  family: z.nativeEnum(IPFamily),
});

export const pxFQDNResponse = z.object({
  is_valid: z.boolean(),
  candidate: ipSchema.optional(),
  ips: z.array(ipSchema).optional().default([]),
  error: z.string().optional(),
});

export type PxFQDNResponse = z.infer<typeof pxFQDNResponse>;

export const pxGridServiceOverviewSchema = z.object({
  service_name: z.string(),
  friendly_name: z.string(),
  display_name: z.string().optional(),
  wiki: z.string().optional(),
  description: z.string().optional(),
});

export type PxGridServiceOverview = z.infer<typeof pxGridServiceOverviewSchema>;

export const pxGridServicesSchema = z.object({
  services: z.array(pxGridServiceOverviewSchema).optional().default([]),
});

export type PxGridServices = z.infer<typeof pxGridServicesSchema>;

const baseJsonSchema = z.object({
  type: z.enum(["string", "integer", "array", "object"]),
  $comment: z.string().optional(),
  enum: z.array(z.string()).optional(),
});

type JsonSchema = z.infer<typeof baseJsonSchema> & {
  items?: JsonSchema;
};

const jsonSchema: z.ZodType<JsonSchema> = baseJsonSchema.extend({
  items: z.lazy(() => jsonSchema).optional(),
});

export type PxGridRestParam = { name: string; schema?: JsonSchema | null };

const pxGridRestParamSchema = z
  .object({
    name: z.string(),
    schema: zodJSONString.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.schema) {
      const schema = jsonSchema.safeParse(data.schema);
      if (schema.success) {
        return {
          ...data,
          schema: schema.data,
        };
      }
      schema.error.errors.forEach((error) => {
        ctx.addIssue(error);
      });
      return z.NEVER;
    }
    return data;
  })
  .transform((value) => value as PxGridRestParam);

const pxGridServiceNodeSchema = z.object({
  name: z.string(),
  node_name: z.string(),
  properties: z.record(z.string(), z.string()),
});

export type PxGridServiceNode = z.infer<typeof pxGridServiceNodeSchema>;

export const pxGridServiceSchema = z.object({
  lookup: z
    .object({
      nodes: z.array(pxGridServiceNodeSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
  rest: z
    .array(
      z.object({
        name: z.string(),
        wiki: z.string().optional(),
        description: z.string().optional(),
        params: z.array(pxGridRestParamSchema).optional().default([]),
      }),
    )
    .optional()
    .nullable()
    .transform((value) => value ?? []),
  topics: z
    .array(z.string())
    .optional()
    .nullable()
    .transform((value) => value ?? []),
});

export type PxGridService = z.infer<typeof pxGridServiceSchema>;

const pxGridServiceTopicSchema = z.object({
  destination: z.string(),
  description: z.string().optional(),
});

const pxGridServiceTopicsSchema = z.record(
  z.string(),
  pxGridServiceTopicSchema,
);

export type PxGridServiceTopics = z.infer<typeof pxGridServiceTopicsSchema>;

const pxGridSubscriptionSchema = z.object({
  pubsub: z.string().optional(),
  destination: z.string().optional(),
  connected: z.boolean().optional(),
  nodes: z.array(z.string()).optional(),
  service: z.string().optional(),
  topic: z.string().optional(),
});

export type PxGridSubscription = z.infer<typeof pxGridSubscriptionSchema>;

export const pxGridTopicsSchema = z.object({
  topics: z
    .record(z.string(), pxGridServiceTopicsSchema)
    .optional()
    .nullable()
    .transform((value) => value ?? {}),
  subscriptions: z
    .array(pxGridSubscriptionSchema)
    .optional()
    .nullable()
    .transform((value) => value ?? []),
});

export type PxGridTopics = z.infer<typeof pxGridTopicsSchema>;

const PxGridRestResponseDetailsSchema = z.object({
  StatusCode: z.number(),
  Result: z.any(),
  Body: zodJSONString,
});

type PxGridRestResponseDetails = z.infer<
  typeof PxGridRestResponseDetailsSchema
>;

export function isPxGridRestResponseDetails(
  value: unknown,
): value is PxGridRestResponseDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "StatusCode" in value &&
    "Body" in value
  );
}

export const PxGridRestResponseSchema = z.object({
  json_response: zodJSONString.transform((value) => {
    if (!value || typeof value !== "object") {
      return value;
    }

    const p = PxGridRestResponseDetailsSchema.safeParse(value);
    if (p.success) {
      return p.data;
    }

    return value;
  }),
});

export type PxGridRestResponse = z.infer<typeof PxGridRestResponseSchema>;

const pxGridMessageSchema = z.object({
  id: z.number(),
  client: z.string(),
  topic: z.string(),
  message: zodJSONString.optional(),
  timestamp: zodTime,
  viewed: z.boolean().optional().default(false),
});

export type PxGridMessage = z.infer<typeof pxGridMessageSchema>;

export const pxGridMessagesSchema = z.object({
  messages: z
    .array(pxGridMessageSchema)
    .optional()
    .nullable()
    .transform((value) => value ?? []),
  total: z.number().optional().default(0),
  limit: z.number().optional().default(0),
});

const PxGridLogSchema = z.object({
  id: z.number(),
  client: z.string(),
  level: z.string(),
  timestamp: zodTime,
  message: zodJSONString.nullish(),
  label: z.string().nullish(),
});

export type PxGridLog = z.infer<typeof PxGridLogSchema>;

export const pxGridLogsSchema = z.object({
  connection_logs: z
    .array(PxGridLogSchema)
    .optional()
    .nullable()
    .transform((value) => value ?? []),
  total: z.number().optional().default(0),
  limit: z.number().optional().default(0),
});
