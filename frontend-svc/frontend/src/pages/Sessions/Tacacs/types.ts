import type { PropsWithChildren } from "react";
import type { RowSelectionState } from "@tanstack/react-table";

export type ActionsProps = {
  selected: RowSelectionState;
  collapsed: boolean;
};

export type ActionsContextProps = PropsWithChildren<
  Omit<ActionsProps, "collapsed">
>;

export type SupportedActions = "remove";

export type SupportedActionsCamelized = Camelize<SupportedActions>;

export type ActionOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export interface ActionPayload
  extends Record<SupportedActionsCamelized, Record<string, any>> {
  remove: {
    sessions: "all" | "selected" | "older-than-5-days" | string[];
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
