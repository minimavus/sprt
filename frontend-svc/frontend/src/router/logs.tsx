import type { RouteObject } from "react-router-dom";

import { Logs } from "@/pages/Logs";
import { LogsChunks } from "@/pages/Logs/LogsChunks";
import { LogsStream } from "@/pages/Logs/LogsStream";

export const logsRoutes: RouteObject = {
  path: "/logs",
  element: <Logs />,
  handle: { title: "Logs" },
  // loader: logOwnersLoader,
  children: [
    {
      path: ":owner",
      element: <LogsChunks />,
    },
    {
      path: ":owner/:chunk",
      element: <LogsStream />,
    },
  ],
};
