export function getClassName(
  classes: Record<string, string>,
  prefix: string,
): string {
  return Object.keys(classes)
    .filter((key) => key.startsWith(prefix))
    .reduce(
      (acc, key) => (key.length < acc.length || acc.length === 0 ? key : acc),
      "",
    );
}
