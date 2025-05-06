import { z } from "zod";

import { zodBool } from "@/utils/zodBool";

// "generator.source-ip.exclude":          "Excluded IPs",
// 	"generator.source-ip.allowed":          "Allowed IPs",
// 	"generator.source-ip.auto-detect":      "Auto-detect IPs and interfaces",
// 	"generator.source-ip.explicit-sources": "Explicit source IPs",
// 	"generator.max-var-tries":              "Max tries for variable generation",
// 	"generator.patterns.session-id":        "Session ID pattern",
// 	"generator.watcher-lifetime":           "Watcher lifetime",
// 	"generator.jobs.max-conc":              "Max concurrent jobs per user",
// 	"generator.jobs.max-threads":           "Max threads per job",
// 	"generator.jobs.max-sessions-per-job":  "Max sessions per job",

const iPSourceSchema = z.object({
  address: z.string(),
  interface: z.string(),
});

export const iPSourcesSchema = z.object({
  ipv4: z.array(iPSourceSchema).optional(),
  ipv6: z.array(iPSourceSchema).optional(),
});

export type IPSources = z.infer<typeof iPSourcesSchema>;

export const globalConfigSchema = z.object({
  "generator.source-ip.exclude": z.array(z.string()).optional(),
  "generator.source-ip.allowed": z.array(z.string()).optional(),
  "generator.source-ip.auto-detect": zodBool.optional(),
  "generator.source-ip.explicit-sources": z.array(z.string()).optional(),
  "generator.max-var-tries": z.coerce.number().int().nonnegative().optional(),
  "generator.patterns.session-id": z.string().optional(),
  "generator.watcher-lifetime": z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
  "generator.jobs.max-conc": z.coerce.number().int().nonnegative().optional(),
  "generator.jobs.max-threads": z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
  "generator.jobs.max-sessions-per-job": z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
  "generator.radius.max-retransmits": z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
  "generator.radius.max-retransmit-timeout": z.coerce
    .number()
    .int()
    .nonnegative()
    .optional(),
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;
