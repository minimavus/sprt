import { z } from "zod";

import {
  CertTemplate,
  CertTemplateContentSchema,
  CertTemplateSchema,
  RDNOrder,
  SANKeysOrder,
} from "@/hooks/certificates/templates";

import { FormValues } from "./types";

export const formSchemaResolver = CertTemplateSchema.merge(
  z.object({
    content: CertTemplateContentSchema,
    withKeyUsage: z.boolean().default(false),
    withExtKeyUsage: z.boolean().default(false),
    friendly_name: z.string().min(1, "Cannot be empty"),
  }),
)
  .transform(({ withKeyUsage, withExtKeyUsage, ...rest }) => {
    if (!withKeyUsage) {
      Object.keys(rest.content.key_usage).forEach(
        (k) =>
          (rest.content.key_usage[k as keyof typeof rest.content.key_usage] =
            false),
      );
    }
    if (!withExtKeyUsage) {
      Object.keys(rest.content.ext_key_usage).forEach(
        (k) =>
          (rest.content.ext_key_usage[
            k as keyof typeof rest.content.ext_key_usage
          ] = false),
      );
    }

    switch (rest.content.key_type) {
      case "rsa":
        delete rest.content.e_curve;
        break;
      case "ecdsa":
        delete rest.content.key_length;
        break;
    }

    return rest;
  })
  .superRefine((data, ctx) => {
    if (data.content.subject) {
      for (const k in data.content.subject) {
        const p = z
          .array(z.string().min(1, "Cannot be empty"))
          .safeParse(
            data.content.subject[k as keyof typeof data.content.subject],
          );
        if (!p.success) {
          p.error.issues.forEach((i) =>
            ctx.addIssue({ ...i, path: ["content", "subject", k, ...i.path] }),
          );
          return z.NEVER;
        }
      }
    }
    if (data.content.san) {
      for (const k in data.content.san) {
        const p = z
          .array(z.string().min(1, "Cannot be empty"))
          .safeParse(data.content.san[k as keyof typeof data.content.san]);
        if (!p.success) {
          p.error.issues.forEach((i) =>
            ctx.addIssue({ ...i, path: ["content", "san", k, ...i.path] }),
          );
          return z.NEVER;
        }
      }
    }
    return data;
  });

export const prepDefaultValues =
  (getter: CertTemplate | Promise<CertTemplate>) =>
  async (): Promise<FormValues> => {
    const t = await getter;
    const withKeyUsage = t.content
      ? Object.keys(t.content.key_usage).some(
          (k) => t.content!.key_usage[k as keyof typeof t.content.key_usage],
        )
      : false;
    const withExtKeyUsage = t.content
      ? Object.keys(t.content.ext_key_usage).some(
          (k) =>
            t.content!.ext_key_usage[k as keyof typeof t.content.ext_key_usage],
        )
      : false;

    if (t.content) {
      t.content.san ??= {};

      for (const k of SANKeysOrder) {
        if (!t.content.san[k] || t.content.san[k].length === 0) {
          t.content.san[k] = [];
        }
      }

      t.content.subject ??= {};

      for (const k of RDNOrder) {
        if (!t.content.subject[k] || t.content.subject[k].length === 0) {
          t.content.subject[k] = [];
        }
      }
    }

    return {
      ...t,
      withKeyUsage,
      withExtKeyUsage,
    };
  };
