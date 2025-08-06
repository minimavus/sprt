import type { Duration } from "date-fns";
import { normalize, toMilliseconds } from "duration-fns";
import parse from "parse-duration";
import { z } from "zod";

export const millisecondsToDuration = (milliseconds: number): Duration => {
  return normalize({ milliseconds });
};

export const durationToMilliseconds = (duration: Duration): number => {
  return toMilliseconds(duration);
};

const zeroDuration = (): Duration => ({
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

export const zodDuration = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    if (v === "") {
      return zeroDuration();
    }

    if (typeof v === "number") {
      return millisecondsToDuration(v);
    }

    let ms: number;
    try {
      const parsed = parse(v);
      if (parsed === undefined || parsed === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Not a duration",
        });
        return z.NEVER;
      }
      ms = parsed;
    } catch (err) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${err}` });
      return z.NEVER;
    }

    return millisecondsToDuration(ms);
  });

const durProps: (keyof Duration)[] = [
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
] as const;

export const isZeroDuration = (d: Duration | null | undefined): boolean => {
  if (!d) return true;

  for (const prop of durProps) {
    if (prop in d && d[prop] !== 0) return false;
  }

  return true;
};
