import { useConfig } from "@/hooks/config/useConfig";

export const useMaxAmountOfSessions = () => {
  const { data } = useConfig();
  const maxSessions = data?.["generator.jobs.max-sessions-per-job"]?.value;
  return maxSessions;
};
