import { z } from "zod/v4";

export const zodBool = z
  .union([z.string(), z.number(), z.boolean()])
  .nullable()
  .transform((val) => {
    switch (typeof val) {
      case "string":
        return val.toLowerCase() === "true";
      case "number":
        return val !== 0;
      default:
        if (val === null) return null;
        return val;
    }
  });
