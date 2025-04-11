import { createContext, ReactNode, use, useCallback, type FC } from "react";
import { noop, Text } from "@mantine/core";

import { useDynamicConfirmation } from "@/components/Modals/Confirmation";

import type {
  ActionOptions,
  ActionPayload,
  Actions,
  ActionsContextProps,
} from "./types";

const ActionsContext = createContext<Actions>({
  remove: noop,
});

export const useActionsContext = () => {
  return use(ActionsContext);
};

export const ActionsProvider: FC<ActionsContextProps> = ({
  children,
  selected,
}) => {
  const confirm = useDynamicConfirmation();

  const remove = useCallback(
    (payload: ActionPayload["remove"], options?: ActionOptions) => {
      let message: ReactNode;
      switch (payload.sessions) {
        case "all":
          message = "Are you sure you want to remove all sessions?";
          break;
        case "selected":
          message = (
            <>
              Are you sure you want to remove{" "}
              <Text span fw="bold">
                {Object.keys(selected).length}
              </Text>{" "}
              selected sessions?
            </>
          );
          break;
        case "older-than-5-days":
          message =
            "Are you sure you want to remove all sessions older than 5 days?";
          break;
        default:
          message = (
            <>
              Are you sure you want to remove{" "}
              <Text span fw="bold">
                {payload.sessions.length}
              </Text>{" "}
              selected sessions?
            </>
          );
          break;
      }

      confirm({
        children: <Text>{message}</Text>,
        onConfirm: async () => {
          console.log("TODO: remove sessions", payload);
        },
        confirmText: "Remove",
        destructive: true,
      });
    },
    [selected, confirm],
  );

  return <ActionsContext value={{ remove }}>{children}</ActionsContext>;
};
