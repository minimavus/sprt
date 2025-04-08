import { createContext, use, useCallback, useState, type FC } from "react";
import { Modal, noop } from "@mantine/core";

import { modals } from "./actionModal";
import type {
  ActionOptions,
  ActionPayload,
  Actions,
  ActionsContextProps,
  SupportedActions,
} from "./types";

const ActionsContext = createContext<Actions>({
  interimUpdate: noop,
  drop: noop,
  policies: noop,
  guest: noop,
  remove: noop,
});

export const useActionsContext = () => {
  return use(ActionsContext);
};

type currentAction<K extends SupportedActions> = {
  action: K;
  payload: ActionPayload[Camelize<K>];
  options?: ActionOptions;
};

export const ActionsProvider: FC<ActionsContextProps> = ({
  children,
  selected,
  sessions,
}) => {
  const [action, setAction] = useState<currentAction<SupportedActions> | null>(
    null,
  );

  const interimUpdate = useCallback(
    (payload: ActionPayload["interimUpdate"], options?: ActionOptions) => {
      setAction({ action: "interim-update", payload, options });
    },
    [setAction],
  );

  const drop = useCallback(
    (payload: ActionPayload["drop"], options?: ActionOptions) => {
      setAction({ action: "drop", payload, options });
    },
    [setAction],
  );

  const policies = useCallback(
    (payload: ActionPayload["policies"], options?: ActionOptions) => {
      setAction({ action: "policies", payload, options });
    },
    [setAction],
  );

  const guest = useCallback(
    (payload: ActionPayload["guest"], options?: ActionOptions) => {
      setAction({ action: "guest", payload, options });
    },
    [setAction],
  );

  const remove = useCallback(
    (payload: ActionPayload["remove"], options?: ActionOptions) => {
      setAction({ action: "remove", payload, options });
    },
    [setAction],
  );

  const onClose = useCallback(() => {
    setAction(null);
  }, [setAction]);

  const ModalBody = action ? modals[action.action] : null;

  return (
    <ActionsContext value={{ interimUpdate, drop, policies, guest, remove }}>
      {children}
      <Modal
        size="xl"
        onClose={onClose}
        opened={Boolean(action)}
        title={ModalBody?.modalTitle}
      >
        {ModalBody ? (
          <ModalBody
            onClose={onClose}
            selected={selected}
            sessions={sessions}
            payload={action?.payload as any}
          />
        ) : null}
      </Modal>
    </ActionsContext>
  );
};
