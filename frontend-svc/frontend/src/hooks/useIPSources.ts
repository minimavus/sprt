import { z } from "zod";

import { api } from "@/utils/apiCompose";

import { useGetQuery } from "./useGetQuery";

const iPSourceSchema = z.object({
  address: z.string(),
  interface: z.string(),
});

const iPSourcesSchema = z.object({
  ipv4: z.array(iPSourceSchema).optional(),
  ipv6: z.array(iPSourceSchema).optional(),
});

export type IPSources = z.infer<typeof iPSourcesSchema>;

export function useIPSources() {
  return useGetQuery({
    url: api.v2`various/ip-sources`,
    queryKey: ["ip-sources"],
    schema: iPSourcesSchema,
  });
}
