export function flattenObject<T extends Record<string, unknown>>(
  obj: T,
  parentKey = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const key in obj) {
    const propName = parentKey ? `${parentKey}.${key}` : key;
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      flattenObject(obj[key] as Record<string, unknown>, propName, result);
    } else {
      result[propName] = obj[key];
    }
  }
  return result;
}
