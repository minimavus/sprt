import { z } from "zod";

const isWithNanos = (v: unknown): v is { seconds: number; nanos: number } =>
  typeof v === "object" && v !== null && "seconds" in v && "nanos" in v;

const toTime = (v: unknown): Date | null => {
  if (!v) {
    return null;
  }
  if (typeof v === "string") {
    return v === "0001-01-01T00:00:00Z" ? null : new Date(v);
  }
  if (typeof v === "number") {
    return new Date(v * 1000);
  }
  if (isWithNanos(v)) {
    return new Date(v.seconds * 1000 + v.nanos / 1_000_000);
  }
  return null;
};

export const zodTime = z.any().nullish().transform(toTime);
