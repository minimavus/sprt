import { z } from "zod";

export const zodJSONString = z
  .string()
  .nullable()
  .transform((v) => {
    if (v === null) {
      return null;
    }
    try {
      return JSON.parse(v);
    } catch (_e) {
      return v;
    }
  });
