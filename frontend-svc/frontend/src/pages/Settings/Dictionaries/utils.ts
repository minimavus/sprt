import type { FullDictionary } from "@/hooks/settings/dictionaries";

export function getFormDefaultValues(
  type: string,
  user?: string | null,
): FullDictionary {
  return {
    id: "",
    name: "",
    owner: user || "",
    type: type,
    is_global: false,
    content: "",
  };
}
