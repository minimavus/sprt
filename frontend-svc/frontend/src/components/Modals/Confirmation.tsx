import { useCallback, type FC, type ReactNode } from "react";
import { LoadingOverlay, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { err, ok, type Result } from "neverthrow";

import { DisplayError } from "@/components/Error";
import { getErrorMessage } from "@/utils/errors";

type ConfirmValidation = Result<void, string>;

type AsyncConfirmHandler = () =>
  | ConfirmValidation
  | void
  | Promise<ConfirmValidation | void>;

export type ConfirmationProps = Omit<
  Parameters<typeof modals.openConfirmModal>[0],
  "onConfirm"
> & {
  destructive?: boolean;
  confirmText: ReactNode;
  onConfirm: AsyncConfirmHandler;
};

const ConfirmationBody: FC<
  Pick<ConfirmationProps, "children"> & { error?: unknown }
> = ({ children, error }) => {
  return (
    <Stack>
      {error ? <DisplayError error={error} before={null} /> : null}
      {typeof children === "string" ? (
        <Text size="sm">{children}</Text>
      ) : (
        children
      )}
    </Stack>
  );
};

const useDynamicConfirmation = () => {
  return useCallback(
    ({
      children,
      onClose,
      destructive,
      onConfirm,
      confirmText,
      size = "lg",
      ...props
    }: ConfirmationProps) => {
      let modalId: string = "";

      const handleConfirm = async () => {
        let realResult: Result<void, string> = ok(undefined);
        if (onConfirm) {
          try {
            const result = onConfirm();
            if (result !== undefined && result instanceof Promise) {
              modals.updateModal({
                ...props,
                modalId,
                closeOnClickOutside: false,
                closeOnEscape: false,
                children: (
                  <>
                    <LoadingOverlay
                      visible
                      zIndex={1000}
                      overlayProps={{ radius: "sm", blur: 2 }}
                    />
                    <ConfirmationBody>{children}</ConfirmationBody>
                  </>
                ),
              });

              realResult = (await result) ?? ok(undefined);
            } else if (result) {
              realResult = result;
            }
          } catch (e) {
            realResult = err(getErrorMessage(e)!);
          }
        }

        if (!realResult.isErr()) {
          modals.close(modalId);
          return;
        }

        modals.updateModal({
          ...props,
          modalId,
          closeOnClickOutside: true,
          closeOnEscape: true,
          children: (
            <ConfirmationBody error={realResult.error}>
              {children}
            </ConfirmationBody>
          ),
        });
      };

      modalId = modals.openConfirmModal({
        ...props,
        onClose,
        size,
        onConfirm: handleConfirm,
        closeOnConfirm: false,
        cancelProps: {
          variant: "default",
        },
        confirmProps: {
          color: destructive ? "red" : undefined,
        },
        labels: {
          confirm: confirmText,
          cancel: "Cancel",
        },
        title: "Confirmation",
        withCloseButton: false,
        children: <ConfirmationBody>{children}</ConfirmationBody>,
      });
    },
    [],
  );
};

const Confirmation = () => null;

export { useDynamicConfirmation, Confirmation };
