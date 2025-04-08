export type ProblemJson = {
  error: string;
  detail: string;
  instance?: string;
  status?: number;
  title?: string;
  [custom: string]: unknown;
};

export function isProblemJson(data: unknown): data is ProblemJson {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    "detail" in data
  );
}
