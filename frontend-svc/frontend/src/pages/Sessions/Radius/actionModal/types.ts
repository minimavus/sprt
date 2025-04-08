import { FC } from "react";
import { ComboboxData } from "@mantine/core";

import { ActionModalProps } from ".";
import { SupportedActions } from "../types";

export type SessionTimeVariant = "sinceStart" | "sinceLastUpdate" | "custom";

export const SessionTimeVariants: ComboboxData = [
  { label: "Since Start", value: "sinceStart" },
  { label: "Since Last Update", value: "sinceLastUpdate" },
  { label: "Custom", value: "custom" },
];

export interface ServerProps {
  server: {
    address: string;
    acctPort: number;
    shared: string;
    sourceIP: string;
  };
}

export interface SharedFlags {
  _multiple: boolean;
  multiThread: boolean;
  differentServer: boolean;
}

export interface FormDataFlags {
  flags: SharedFlags;
}

export type ActionModal<K extends SupportedActions> = FC<
  ActionModalProps<Camelize<K>>
> & { modalTitle: string };
