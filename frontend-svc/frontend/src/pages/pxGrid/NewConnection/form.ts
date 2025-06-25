import { z } from "zod/v4";

export const newConnectionSchema = z.object({
  friendlyName: z.string().min(1),
  clientName: z.string().min(1),
  description: z.string().optional(),
  dns: z.object({
    ip: z.string().optional(),
    port: z.number().int().min(1).max(65535),
  }),
  nodes: z
    .array(
      z.object({
        fqdn: z.string().min(1),
        controlPort: z.number().int().min(1).max(65535),
      }),
    )
    .min(1),
  auth: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("password"),
    }),
    z.object({
      type: z.literal("certificate"),
      certificate: z.string().min(1),
      privateKey: z.string().min(1),
      passphrase: z.string().min(1),
    }),
  ]),
  serverVerify: z.discriminatedUnion("verify", [
    z.object({
      verify: z.literal(false),
    }),
    z.object({
      verify: z.literal(true),
      ca: z.array(z.string()).min(1),
    }),
  ]),
});

export type NewConnectionFields = z.infer<typeof newConnectionSchema>;

export const generalFieldsValidator = newConnectionSchema.pick({
  friendlyName: true,
  clientName: true,
  description: true,
  dns: true,
  nodes: true,
});

export type GeneralFields = z.infer<typeof generalFieldsValidator>;

export const authFieldsValidator = newConnectionSchema.pick({
  auth: true,
});

export type AuthFields = z.infer<typeof authFieldsValidator>;

export const serverVerifyFieldsValidator = newConnectionSchema.pick({
  serverVerify: true,
});

export type ServerVerifyFields = z.infer<typeof serverVerifyFieldsValidator>;

export const emptyConnection = (): NewConnectionFields =>
  ({
    friendlyName: "",
    clientName: "",
    description: "",
    dns: {
      ip: "",
      port: 53,
    },
    nodes: [
      {
        fqdn: "",
        controlPort: 8910,
      },
    ],
    auth: {
      type: "password",
    },
    serverVerify: {
      verify: false,
    },
  }) satisfies NewConnectionFields;
