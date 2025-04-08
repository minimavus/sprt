import { focusManager, QueryClient } from "@tanstack/react-query";
import { secondsToMilliseconds } from "date-fns";

focusManager.setEventListener((handleFocus) => {
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("focus", () => handleFocus(), false);
    return () => {
      window.removeEventListener("focus", () => handleFocus());
    };
  }
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: secondsToMilliseconds(10),
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: "always",
    },
  },
});
