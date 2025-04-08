import type { ActionModalProps } from ".";
import { ActionPayload, ActionPayloadKeysWithSessions } from "../types";

type Result<K extends ActionPayloadKeysWithSessions> =
  ActionPayload[K]["sessions"];

export const mapSelectedToIDs = <K extends ActionPayloadKeysWithSessions>(
  payload: ActionModalProps<K>["payload"],
  selected: ActionModalProps<K>["selected"],
  sessions: ActionModalProps<K>["sessions"],
): Result<K> | undefined => {
  if (typeof payload?.sessions !== "string") {
    return payload?.sessions;
  }

  if (payload.sessions !== "selected") {
    return payload?.sessions;
  }

  if (!selected || !sessions) {
    return undefined;
  }

  return Object.keys(selected);
};
