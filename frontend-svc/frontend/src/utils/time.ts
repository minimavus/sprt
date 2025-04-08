import { format } from "date-fns";

type FormatOptions = {
  withTZ?: boolean;
};

export const formatTime = (
  d: Date,
  { withTZ = false }: FormatOptions = {},
): string => format(d, `dd-MMM-yyy pp${withTZ ? " (O)" : ""}`);

export const formatDate = (d: Date): string => format(d, "PPPP");
