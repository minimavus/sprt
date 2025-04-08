import { AxiosError } from "axios";

export type RetryOptions = {
  maxFailures?: number;
};

const failOrRetry =
  ({ maxFailures = 3 }: RetryOptions = {}) =>
  (failureCount: number, error: unknown): boolean => {
    if (
      error instanceof AxiosError &&
      (error.response?.status === 403 ||
        error.response?.status === 401 ||
        error.response?.status === 404)
    ) {
      // no retries if 401, 403, 404 errors
      return false;
    }
    return failureCount <= maxFailures;
  };

export default failOrRetry;
