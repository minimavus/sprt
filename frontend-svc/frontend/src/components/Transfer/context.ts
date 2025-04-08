import { createContext } from "react";

import { TransferSideState } from "./types";

export const TransferSideContext = createContext<TransferSideState>(
  undefined as any,
);
