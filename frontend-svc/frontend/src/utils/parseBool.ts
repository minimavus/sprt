export const parseBool = (
  v: unknown,
  { nullAsUndefined = false }: { nullAsUndefined?: boolean } = {},
): boolean | undefined => {
  if (v === undefined) return undefined;
  if (nullAsUndefined && v === null) return undefined;

  if (typeof v === "string") {
    v = v.toLowerCase();
    return v === "true" || v === "1";
  }

  return Boolean(v);
};
