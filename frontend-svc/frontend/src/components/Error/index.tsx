import { ComponentProps, FC, ReactNode } from "react";
import { AlertProps, Button, Text } from "@mantine/core";
import { AxiosError } from "axios";
import { useAsyncError } from "react-router-dom";

import { Warning } from "../Alerts";

function extendsError(
  error: unknown,
): error is { message?: any; statusText?: any } {
  return (
    typeof error === "object" &&
    error !== null &&
    ("message" in error || "statusText" in error)
  );
}

function isString(error: unknown): error is string {
  return typeof error === "string";
}

type ProblemJSON = {
  status: number;
  title: string;
  detail: any;
  [x: string]: unknown;
};

function isProblemJSON(error: unknown): error is ProblemJSON {
  return (
    typeof error === "object" &&
    error !== null &&
    ("status" in error || "title" in error || "detail" in error)
  );
}

function hasReason(error: unknown): error is { reason: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "reason" in error &&
    typeof (error as any).reason === "string"
  );
}

const DisplayProblemJSON: FC<{ error: ProblemJSON }> = ({ error }) => {
  return (
    <>
      <Text size="sm">
        <i>{error.title}</i>
      </Text>
      <Text size="sm">{hasReason(error) ? error.reason : error.detail}</Text>
    </>
  );
};

type DisplayErrorTextProps = {
  error: unknown;
  before?: ReactNode;
  after?: ReactNode;
};

const BeforeAfterWrapper: FC<{
  children?: ReactNode;
  position: "before" | "after";
}> = ({ children, position }) => {
  if (typeof children === "string" || typeof children === "number") {
    return (
      <Text
        size="sm"
        style={{
          marginTop: position === "before" ? 0 : 8,
          marginBottom: position === "after" ? 0 : 8,
        }}
      >
        {children}
      </Text>
    );
  }

  return children;
};

export const DisplayErrorText: FC<DisplayErrorTextProps> = ({
  error,
  before = "Oops, an unexpected error has occurred.",
  after,
}) => {
  if (error instanceof AxiosError) {
    if (error.status === 404 || error.response?.status === 404) {
      return (
        <Text size="sm" style={{ marginTop: 0 }}>
          Requested resource not found.
        </Text>
      );
    }

    return (
      <>
        <BeforeAfterWrapper position="before">{before}</BeforeAfterWrapper>
        {error.response?.data && isProblemJSON(error.response.data) ? (
          <DisplayProblemJSON error={error.response.data} />
        ) : (
          <Text size="sm">
            <i>{error.message}</i>
          </Text>
        )}
        <BeforeAfterWrapper position="after">{after}</BeforeAfterWrapper>
      </>
    );
  }

  return (
    <>
      <BeforeAfterWrapper position="before">{before}</BeforeAfterWrapper>
      {extendsError(error) ? (
        <Text size="sm">
          <i>{error.message || error.statusText}</i>
        </Text>
      ) : isString(error) ? (
        <Text size="sm">{error}</Text>
      ) : null}
      <BeforeAfterWrapper position="after">{after}</BeforeAfterWrapper>
    </>
  );
};

type ErrorResetProps = {
  onReset?: () => void;
};

export const DisplayError: FC<
  ComponentProps<typeof DisplayErrorText> &
    ErrorResetProps &
    Pick<AlertProps, "title">
> = ({ onReset, title = "Error", ...props }) => {
  return (
    <Warning variant="light" title={title}>
      <DisplayErrorText {...props} />
      {onReset ? (
        <Button onClick={onReset} size="compact-sm">
          Try again
        </Button>
      ) : null}
    </Warning>
  );
};

export const AwaitError: FC<Pick<DisplayErrorTextProps, "after" | "before">> = (
  props,
) => {
  const error = useAsyncError();
  return <DisplayError {...props} error={error} />;
};
