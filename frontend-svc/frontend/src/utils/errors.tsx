import { Text } from "@mantine/core";
import { isAxiosError } from "axios";
import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

type InvalidParam = {
  name: string;
  reason: string;
};

export type JSONError = {
  detail?: string;
  error?: string;
  instance?: string;
  reason?: string;
  status?: number;
  title?: string;
  "invalid-params"?: InvalidParam[];
};

export function isJSONError(error: unknown): error is JSONError {
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

function composeErrorMessageFromJSONError(
  error: JSONError,
  fallback: string,
  rawString?: boolean,
): ReactNode | string {
  let m = [cleanupRpcPrefix(error.reason || error.detail || fallback)];

  if (
    Array.isArray(error["invalid-params"]) &&
    error["invalid-params"].length > 0
  ) {
    m.push(
      "Invalid parameters: ",
      ...error["invalid-params"].map((p) => `${p.name}: ${p.reason}`),
    );
  }

  if (rawString) {
    return m.join("\n");
  }

  return m.map((line, i) => (
    <Text
      key={i}
      size={i === 0 ? undefined : "xs"}
      ml={i === 0 ? undefined : "xs"}
    >
      {line}
      {i < m.length - 1 ? <br /> : null}
    </Text>
  ));
}

export function getErrorMessage<RawString extends boolean = false>(
  error: unknown,
  rawString?: RawString,
): RawString extends true ? string | undefined : ReactNode | undefined {
  if (error === undefined || error === null) {
    return undefined as RawString extends true
      ? string | undefined
      : ReactNode | undefined;
  }

  let message: string | ReactNode;

  if (isAxiosError(error) && isJSONError(error.response?.data)) {
    message = composeErrorMessageFromJSONError(
      error.response.data,
      error.message,
    );
  } else if (isFieldError(error)) {
    message = error.message || "Required";
  } else {
    message =
      error instanceof Error
        ? cleanupRpcPrefix(error.message)
        : typeof error === "string"
          ? error
          : "Something went wrong";
  }

  // Return string when rawString is true, ReactNode otherwise
  return (rawString === true ? message : message) as RawString extends true
    ? string | undefined
    : ReactNode | undefined;
}

export const maybeError = (error: unknown): ReactNode | string | undefined => {
  if (error === undefined || error === null) {
    return undefined;
  }

  return getErrorMessage(error);
};
