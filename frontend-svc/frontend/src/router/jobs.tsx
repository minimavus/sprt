import type { RouteObject } from "react-router-dom";

import { Jobs, jobsLoader } from "@/pages/Jobs";

export const jobsRoutes: RouteObject = {
  path: "/jobs",
  element: <Jobs />,
  loader: jobsLoader,
  handle: {
    title: "Jobs",
  },
};
