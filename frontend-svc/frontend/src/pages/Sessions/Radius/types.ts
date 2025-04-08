import { PropsWithChildren } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

import type { SessionsInBulk } from "@/hooks/sessions/schemas";

export type ActionsProps = {
  selected: RowSelectionState;
  sessions: SessionsInBulk["sessions"] | null | undefined;
  collapsed: boolean;
};

export type ActionsContextProps = PropsWithChildren<
  Omit<ActionsProps, "collapsed">
>;

export type SupportedActions =
  | "interim-update"
  | "drop"
  | "policies"
  | "guest"
  | "remove";

export type SupportedActionsCamelized = Camelize<SupportedActions>;

export type ActionOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export interface ActionPayload
  extends Record<SupportedActionsCamelized, Record<string, any>> {
  interimUpdate: {
    sessions: "all" | "selected" | string[];
  };
  drop: {
    sessions: "all" | "selected" | string[];
  };
  policies:
    | {
        subaction: "get-applied";
      }
    | {
        subaction: "apply";
        by: "ip" | "mac";
      }
    | {
        subaction: "clear";
        by: "ip" | "mac";
      };
  guest: {
    sessions: "all" | "selected" | string[];
  };
  remove: {
    sessions:
      | "all"
      | "selected"
      | "dropped-failed"
      | "older-than-5-days"
      | string[];
  };
}

type WithSessions<T> = {
  [K in keyof T]: T[K] extends { sessions: any } ? K : never;
};

type ActionPayloadWithSessions = WithSessions<ActionPayload>;

export type ActionPayloadKeysWithSessions =
  ActionPayloadWithSessions[keyof ActionPayload];

export type Actions = {
  [K in SupportedActionsCamelized]: (props: ActionPayload[K]) => void;
};
