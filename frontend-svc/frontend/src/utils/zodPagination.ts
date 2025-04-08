import { z } from "zod";

export const zodPagination = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});

export type Pagination = z.infer<typeof zodPagination>;

export type PaginationRequest = Omit<Pagination, "total">;
