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

const router = createBrowserRouter(routes);

export default router;
