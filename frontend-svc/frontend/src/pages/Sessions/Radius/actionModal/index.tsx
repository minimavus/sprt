import type {
  ActionPayload,
  ActionsProps,
  SupportedActions,
  SupportedActionsCamelized,
} from "../types";
import { Drop } from "./Drop";
import { Guest } from "./Guest";
import { InterimUpdate } from "./InterimUpdate";
import { Policies } from "./Policies";
import { Remove } from "./Remove";
import { ActionModal } from "./types";

export type ActionModalProps<K extends SupportedActionsCamelized> = Omit<
  ActionsProps,
  "collapsed"
> & {
  onClose: () => void;
  payload?: ActionPayload[K];
};

export const modals: {
  [K in SupportedActions]: ActionModal<K>;
} = {
  "interim-update": InterimUpdate,
  drop: Drop,
  policies: Policies,
  guest: Guest,
  remove: Remove,
};
