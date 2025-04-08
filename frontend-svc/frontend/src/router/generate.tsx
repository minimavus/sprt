import { redirect, RouteObject } from "react-router-dom";

import { Generate, ProtoDisplay } from "@/pages/Generate";
import { generateLoader } from "@/pages/Generate/loader";

export const generateRoutes: RouteObject = {
  path: "/generate",
  element: <Generate />,
  handle: { title: "Generate" },
  children: [
    {
      path: "",
      element: null,
      loader: () => redirect("/generate/mab"),
    },
    {
      path: ":proto",
      element: <ProtoDisplay />,
      loader: generateLoader,
    },
  ],
};
