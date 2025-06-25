import { z } from "zod/v4";

export const zodFilter = z.object({
  filter_value: z.string().optional(),
  filter_term: z.string().optional(),
});

export type Filter = z.infer<typeof zodFilter>;
