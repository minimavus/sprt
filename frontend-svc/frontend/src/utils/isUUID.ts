import { z } from "zod/v4";

const schema = z.string().uuid();

export function isUUID(value: string): boolean {
  const r = schema.safeParse(value);
  return r.success;
}
