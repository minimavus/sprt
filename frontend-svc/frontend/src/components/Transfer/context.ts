import { createContext } from "react";

import type { TransferSideState } from "./types";

export const TransferSideContext = createContext<TransferSideState>(
  undefined as any,
);
