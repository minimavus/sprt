import { createBrowserRouter, RouteObject } from "react-router-dom";

import { RootLayout } from "@/components/Layout/RootLayout";

import { certRoutes } from "./cert";
import { cleanupRoutes } from "./cleanup";
import { generateRoutes } from "./generate";
import { jobsRoutes } from "./jobs";
import { logsRoutes } from "./logs";
import { pxGridRoutes } from "./pxgrid";
import { sessionsRoutes } from "./sessions";
import { settingsRoutes } from "./settings";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    handle: {
      title: "SPRT",
    },
    children: [
      generateRoutes,
      pxGridRoutes,
      sessionsRoutes,
      logsRoutes,
      cleanupRoutes,
      settingsRoutes,
      certRoutes,
      jobsRoutes,
    ],
  },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default router;
