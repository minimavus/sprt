import { isAxiosError } from "axios";
import { FieldError } from "react-hook-form";

type JSONError = {
  detail?: string;
  error?: string;
  instance?: string;
  reason?: string;
  status?: number;
  title?: string;
};

function isJSONError(error: unknown): error is JSONError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("status" in error ||
      "title" in error ||
      "detail" in error ||
      "error" in error ||
      "instance" in error ||
      "reason" in error)
  );
}

const isFieldError = (error: unknown): error is FieldError =>
  typeof error === "object" && error !== null && "message" in error;

const rpcErrorPrefix = "rpc error: code = Unknown desc = ";

function cleanupRpcPrefix(value: string): string {
  return value.startsWith(rpcErrorPrefix)
    ? value.slice(rpcErrorPrefix.length)
    : value;
}

export function getErrorMessage(error: unknown): string | undefined {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (isAxiosError(error) && isJSONError(error.response?.data)) {
    return cleanupRpcPrefix(error.response?.data?.reason || error.message);
  }

  if (isFieldError(error)) {
    return error.message || "Required";
  }

  return error instanceof Error
    ? cleanupRpcPrefix(error.message)
    : typeof error === "string"
      ? error
      : "Something went wrong";
}

export const maybeError = (error: unknown): string | undefined => {
  if (error === undefined || error === null) {
    return undefined;
  }

  return getErrorMessage(error);
};
