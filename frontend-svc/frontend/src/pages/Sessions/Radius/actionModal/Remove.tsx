import { type ReactNode } from "react";
import { Button, Stack, Text } from "@mantine/core";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";

import type { ActionModalProps } from ".";
import type { ActionPayload } from "../types";
import { ActionModal } from "./types";

export const Remove: ActionModal<"remove"> = ({
  onClose,
  payload,
  selected,
  sessions,
}) => {
  const remove = () => {
    console.log("TODO: Remove");
    onClose();
  };

  return (
    <Stack gap="sm">
      <Text>
        Are you sure you want to delete{" "}
        {getSessionsDisplay(payload, selected, sessions)}?
      </Text>
      <ModalFooter>
        <Button onClick={onClose as any} variant="default">
          Cancel
        </Button>
        <Button onClick={remove} color="red">
          Delete
        </Button>
      </ModalFooter>
    </Stack>
  );
};

Remove.modalTitle = "Delete";

function getSessionsDisplay(
  payload: ActionPayload["remove"] | undefined,
  selected: ActionModalProps<"remove">["selected"],
  sessions: ActionModalProps<"remove">["sessions"],
): ReactNode {
  if (payload?.sessions === "all") {
    return (
      <>
        <Text span fw="bold">
          all
        </Text>{" "}
        sessions
      </>
    );
  } else if (payload?.sessions === "selected") {
    const amount = Object.keys(selected).length;
    return (
      <>
        <Text span fw="bold">
          {amount}
        </Text>{" "}
        session{amount > 1 ? "s" : ""}
      </>
    );
  } else if (payload?.sessions === "dropped-failed") {
    return (
      <>
        <Text span fw="bold">
          dropped & failed
        </Text>{" "}
        sessions
      </>
    );
  } else if (payload?.sessions === "older-than-5-days") {
    return (
      <>
        sessions{" "}
        <Text span fw="bold">
          older than 5 days
        </Text>
      </>
    );
  } else if (Array.isArray(payload?.sessions)) {
    const amount = payload.sessions.length;
    if (amount > 1) {
      return (
        <>
          <Text span fw="bold">
            {amount}
          </Text>{" "}
          sessions
        </>
      );
    } else {
      const session = sessions?.find((s) => s.id === payload.sessions[0]);
      return (
        <>
          session of{" "}
          <Text span fw="bold">
            {session?.mac}
          </Text>
        </>
      );
    }
  }

  return (
    <>
      <Text span fw="bold">
        all
      </Text>{" "}
      sessions
    </>
  );
}
