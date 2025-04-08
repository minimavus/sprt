import { FlowType } from "@/hooks/sessions/schemas";

export const tabNameFromFlowType = {
  "radius-auth": "Authentication",
  "radius-acct": "Accounting",
  "radius-coa": "CoA",
  "radius-disconnect": "Disconnect",
  http: "HTTP",
  "out-of-order": "Out of Order",
  pxgrid: "pxGrid",
  "tacacs-any": "TACACS+",
} as const satisfies Record<FlowType, string>;
