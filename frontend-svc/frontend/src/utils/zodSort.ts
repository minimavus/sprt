import { z } from "zod/v4";

export const zodSort = z.object({
  sort_by: z.string(),
  sort_direction: z
    .string()
    .transform((val) => val.toLowerCase())
    .transform((val) => (val === "asc" || val === "desc" ? val : "asc")),
});

export type Sort = z.infer<typeof zodSort>;
