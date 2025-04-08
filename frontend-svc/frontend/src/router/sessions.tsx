import type { RouteObject } from "react-router-dom";

import {
  radiusSessionsLoader,
  RadiusSessionsPage,
} from "@/pages/Sessions/Radius";
import {
  RadiusSessionDetails,
  radiusSessionDetailsLoader,
} from "@/pages/Sessions/Radius/RadiusSessionDetails";
import {
  RadiusSessionsInBulk,
  radiusSessionsInBulkLoader,
} from "@/pages/Sessions/Radius/RadiusSessionsInBulk";
import {
  tacacsSessionsLoader,
  TacacsSessionsPage,
} from "@/pages/Sessions/Tacacs";
import {
  TacacsSessionDetails,
  tacacsSessionDetailsLoader,
} from "@/pages/Sessions/Tacacs/TacacsSessionDetails";
import {
  TacacsSessionsInBulk,
  tacacsSessionsInBulkLoader,
} from "@/pages/Sessions/Tacacs/TacacsSessionsInBulk";

export const sessionsRoutes: RouteObject = {
  path: "/sessions",
  children: [
    {
      path: "radius",
      element: <RadiusSessionsPage />,
      handle: { title: "RADIUS Servers" },
      loader: radiusSessionsLoader,
    },
    {
      path: "radius/:server",
      element: <RadiusSessionsPage />,
      handle: { title: "RADIUS Sessions" },
      loader: radiusSessionsLoader,
      children: [
        {
          path: ":bulk",
          element: <RadiusSessionsInBulk />,
          loader: radiusSessionsInBulkLoader,
          children: [
            {
              path: ":session",
              element: <RadiusSessionDetails />,
              loader: radiusSessionDetailsLoader,
            },
          ],
        },
      ],
    },
    {
      path: "tacacs",
      element: <TacacsSessionsPage />,
      handle: { title: "TACACS+ Servers" },
      loader: tacacsSessionsLoader,
    },
    {
      path: "tacacs/:server",
      element: <TacacsSessionsPage />,
      handle: { title: "TACACS+ Sessions" },
      loader: tacacsSessionsLoader,
      children: [
        {
          path: ":bulk",
          element: <TacacsSessionsInBulk />,
          loader: tacacsSessionsInBulkLoader,
          children: [
            {
              path: ":session",
              element: <TacacsSessionDetails />,
              loader: tacacsSessionDetailsLoader,
            },
          ],
        },
      ],
    },
  ],
};
