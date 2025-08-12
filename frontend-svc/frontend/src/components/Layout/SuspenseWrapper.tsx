import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { FC, PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { DisplayError } from "@/components/Error";

export const SuspenseWrapper: FC<PropsWithChildren<{ enabled?: boolean }>> = ({
  children,
  enabled,
}) => {
  if (!enabled) return children;

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary, error }) => (
            <DisplayError onReset={() => resetErrorBoundary()} error={error} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
