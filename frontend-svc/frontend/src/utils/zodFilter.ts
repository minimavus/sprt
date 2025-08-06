import { z } from "zod";

export const zodFilter = z.object({
  filter_value: z.string().optional(),
  filter_term: z.string().optional(),
});

export type Filter = z.infer<typeof zodFilter>;
