import { Button } from "@mantine/core";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";

import { ActionModal } from "./types";

export const Policies: ActionModal<"policies"> = ({ onClose, payload }) => {
  return (
    <>
      <pre>{JSON.stringify(payload)}</pre>
      <ModalFooter>
        <Button onClick={onClose as any} variant="default">
          Cancel
        </Button>
      </ModalFooter>
    </>
  );
};

Policies.modalTitle = "Policies";
