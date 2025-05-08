// import { scan } from "react-scan";
//---
import { lazy, Suspense } from "react";
import { CodeHighlightAdapterProvider } from "@mantine/code-highlight";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import AuthHOC from "@/components/Auth";
import { queryClient } from "@/hooks/queryClient";
import { useInitial } from "@/hooks/useInitial";
import router from "@/router";
import { theme } from "@/theme";
import { shikiAdapter } from "@/utils/shiki/shikiAdapter";

// scan({
//   enabled: true,
// });

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  })),
);

function App() {
  const { Environment, Theme } = useInitial();

  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeScript defaultColorScheme={Theme ?? "auto"} />
      <MantineProvider defaultColorScheme={Theme ?? "auto"} theme={theme}>
        <CodeHighlightAdapterProvider adapter={shikiAdapter}>
          <Notifications />
          <ModalsProvider>
            <AuthHOC>
              <RouterProvider router={router} />
            </AuthHOC>
            {Environment !== "production" ? (
              <Suspense>
                <ReactQueryDevtools
                  position="bottom"
                  buttonPosition="bottom-right"
                />
              </Suspense>
            ) : null}
          </ModalsProvider>
        </CodeHighlightAdapterProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
