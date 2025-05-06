import { useConfig } from "@/hooks/config/useConfig";

export const useMaxRetransmits = () => {
  const { data } = useConfig();
  const maxRetransmits = data?.["generator.radius.max-retransmits"]?.value;
  return maxRetransmits;
};
