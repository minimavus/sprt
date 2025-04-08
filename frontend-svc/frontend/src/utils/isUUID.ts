import { z } from "zod";

const schema = z.string().uuid();

export function isUUID(value: string): boolean {
  const r = schema.safeParse(value);
  return r.success;
}
