import type { RouteObject } from "react-router-dom";

import { Cleanup } from "@/pages/Cleanup";
import { CleanupCLIs } from "@/pages/Cleanup/CleanupCLIs";
import { CleanupFlows } from "@/pages/Cleanup/CleanupFlows";
import { CleanupRunningProcesses } from "@/pages/Cleanup/CleanupRunningProcesses";
import { CleanupScheduled } from "@/pages/Cleanup/CleanupScheduled";
import { CleanupSessions } from "@/pages/Cleanup/CleanupSessions";
import { CleanupSettings } from "@/pages/Cleanup/CleanupSettings";

export const cleanupRoutes: RouteObject = {
  path: "/cleanup",
  element: <Cleanup />,
  handle: { title: "Clean Ups" },
  children: [
    {
      path: "",
      element: <CleanupSessions />,
    },
    { path: "flows", element: <CleanupFlows /> },
    { path: "clis", element: <CleanupCLIs /> },
    { path: "processes", element: <CleanupRunningProcesses /> },
    { path: "scheduled", element: <CleanupScheduled /> },
    { path: "settings", element: <CleanupSettings /> },
  ],
};
