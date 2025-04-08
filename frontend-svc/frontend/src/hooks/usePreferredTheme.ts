import { useMediaQuery } from "@mantine/hooks";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export const usePreferredTheme = (): "light" | "dark" => {
  const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);
  return isDarkOS ? "dark" : "light";
};
