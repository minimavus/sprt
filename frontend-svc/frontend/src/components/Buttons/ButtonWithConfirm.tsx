import { forwardRef, type ReactNode } from "react";
import { Button, ButtonProps } from "@mantine/core";
import { ok } from "neverthrow";

import {
  useDynamicConfirmation,
  type ConfirmationProps,
} from "@/components/Modals/Confirmation";

type ButtonWithConfirmProps = Pick<
  ConfirmationProps,
  "confirmText" | "destructive" | "onConfirm"
> &
  Omit<ButtonProps, "onClick"> & {
    children?: ReactNode;
    confirmBody: ReactNode;
  };

export const ButtonWithConfirm = forwardRef<
  HTMLButtonElement,
  ButtonWithConfirmProps
>(
  (
    {
      onConfirm,
      loading,
      destructive,
      children,
      confirmText,
      confirmBody,
      color,
      ...props
    },
    ref,
  ) => {
    const confirm = useDynamicConfirmation();

    return (
      <Button
        color={color ?? (destructive ? "red" : undefined)}
        loading={loading}
        ref={ref}
        onClick={() => {
          confirm({
            children: confirmBody,
            onConfirm: async () => {
              await onConfirm();
              return ok(undefined);
            },
            confirmText,
            destructive,
          });
        }}
        {...props}
      >
        {children}
      </Button>
    );
  },
);
