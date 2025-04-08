import type { RouteObject } from "react-router-dom";

import { PxGrid, pxGridLoader } from "@/pages/pxGrid";
import {
  pxGridConnectionLoader,
  PxGridConnectionPage,
} from "@/pages/pxGrid/Connection";
import { Logs } from "@/pages/pxGrid/Connection/Logs";
import { Messages } from "@/pages/pxGrid/Connection/Messages";
import { Service } from "@/pages/pxGrid/Connection/Service";
import { Settings } from "@/pages/pxGrid/Connection/Settings";
import { Topics } from "@/pages/pxGrid/Connection/Topics";
import { NewConnection } from "@/pages/pxGrid/NewConnection";

export const pxGridRoutes: RouteObject = {
  path: "/pxgrid",
  handle: { title: "pxGrid" },
  children: [
    {
      path: "",
      element: <PxGrid />,
      loader: pxGridLoader,
      children: [
        {
          path: "add",
          element: <NewConnection />,
        },
      ],
    },
    {
      path: ":id",
      element: <PxGridConnectionPage />,
      loader: pxGridConnectionLoader,
      handle: { title: "Consumer" },
      children: [
        {
          path: "services/:service",
          element: <Service />,
        },
        {
          path: "topics",
          element: <Topics />,
        },
        {
          path: "messages",
          element: <Messages />,
        },
        {
          path: "logs",
          element: <Logs />,
        },
        {
          path: "settings",
          element: <Settings />,
        },
      ],
    },
  ],
};
