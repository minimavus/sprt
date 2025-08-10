import { z } from "zod";
import { zodBool } from "@/utils/zodBool";

const fieldSchema = <Z extends z.ZodType>(value: Z) =>
  z.object({
    label: z.string(),
    type: z.string(),
    value,
  });

export const globalConfigValuesSchema = z.object({
  "generator.source-ip.exclude": fieldSchema(z.array(z.string()).nullish()),
  "generator.source-ip.allowed": fieldSchema(z.array(z.string()).nullish()),
  "generator.source-ip.auto-detect": fieldSchema(zodBool.nullish()),
  "generator.source-ip.explicit-sources": fieldSchema(
    z.array(z.string()).nullish(),
  ),
  "generator.max-var-tries": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.patterns.session-id": fieldSchema(z.string().nullish()),
  "generator.watcher-lifetime": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.jobs.max-conc": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.jobs.max-threads": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.jobs.max-sessions-per-job": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.radius.max-retransmits": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
  "generator.radius.max-timeout": fieldSchema(
    z.coerce.number().int().nonnegative().nullish(),
  ),
});

export const globalConfigSchema = z.object({
  config: globalConfigValuesSchema,
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;

export const pluginSchema = z.object({
  name: z.string(),
  schema: z.any(),
});

export const pluginsSchema = z.object({
  plugins: z.array(pluginSchema),
  total: z.number().int().nonnegative(),
});

export type Plugin = z.infer<typeof pluginSchema>;

export type Plugins = z.infer<typeof pluginsSchema>;
