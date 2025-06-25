import { z } from "zod/v4";

export const formSchema = z.discriminatedUnion("requireAuth", [
  z.object({
    method: z.enum(["get", "post"]),
    url: z.string(),
    body: z.string(),
    messageTemplate: z.string(),
    contentType: z.string(),
    requireAuth: z.literal(true),
    auth: z.object({
      username: z.string(),
      password: z.string(),
    }),
  }),
  z.object({
    method: z.enum(["get", "post"]),
    url: z.string(),
    body: z.string(),
    messageTemplate: z.string(),
    contentType: z.string(),
    requireAuth: z.literal(false),
    auth: z
      .object({
        username: z.string(),
        password: z.string(),
      })
      .optional(),
  }),
]);

export type SMSSettingsFormData = z.infer<typeof formSchema>;

type Method = SMSSettingsFormData["method"];

export const methodOptions: { value: Method; label: string }[] = [
  { value: "get", label: "GET" },
  { value: "post", label: "POST" },
];
