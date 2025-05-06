import { useGetQuery } from "@/hooks/useGetQuery";
import { api } from "@/utils/apiCompose";

import { iPSourcesSchema } from "./schemas";

export function useIPSources() {
  return useGetQuery({
    url: api.v2`various/ip-sources`,
    queryKey: ["ip-sources"],
    schema: iPSourcesSchema,
  });
}
