import { useQuery } from "@tanstack/react-query";

import { log } from "@/utils/log";

export function useHostName() {
  return useQuery({
    queryKey: ["settings", "global", "hostname"],
    queryFn: async () => {
      log.warn("FIXME: useHostName is not implemented");
      return "localhost.com:3000";
    },
  });
  // return useGetQuery({
  //   queryKey: ["settings", "global", "hostname"],
  //   url: api.v2`settings/global/hostname`,
  //   schema: z.string(),
  // });
}
