import { type FC, type ReactNode } from "react";
import { Center, Tooltip } from "@mantine/core";
import {
  IconCancel,
  IconInfoCircle,
  IconPlayerPlay,
  IconQuestionMark,
  IconSquareCheck,
  IconUserCircle,
  IconUserPlus,
} from "@tabler/icons-react";

import type { RadiusSession } from "@/hooks/sessions/schemas";

import { stateIconStyle } from "../../styles";

const states = {
  STARTED: (
    <Tooltip withArrow label="Session started">
      <IconPlayerPlay
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-blue-text)" }}
      />
    </Tooltip>
  ),
  ACCOUNTING_STARTED: (
    <Tooltip withArrow label="Accounting started">
      <IconInfoCircle
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-blue-text)" }}
      />
    </Tooltip>
  ),
  ACCEPTED: (
    <Tooltip withArrow label="ACCESS_ACCEPT received">
      <IconSquareCheck
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-green-text)" }}
      />
    </Tooltip>
  ),
  REJECTED: (
    <Tooltip withArrow label="ACCESS_REJECT received">
      <IconCancel
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-red-text)" }}
      />
    </Tooltip>
  ),
  DROPPED: (
    <Tooltip withArrow label="Session was dropped">
      <IconCancel
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-orange-text)" }}
      />
    </Tooltip>
  ),
  GUEST_SUCCESS: (
    <Tooltip withArrow label="Guest authentication was successful">
      <IconUserCircle
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-green-text)" }}
      />
    </Tooltip>
  ),
  GUEST_FAILURE: (
    <Tooltip withArrow label="Guest authentication failed">
      <IconUserCircle
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-red-text)" }}
      />
    </Tooltip>
  ),
  GUEST_REGISTERED: (
    <Tooltip withArrow label="Guest user registered">
      <IconUserPlus
        {...stateIconStyle}
        style={{ color: "var(--mantine-color-blue-text)" }}
      />
    </Tooltip>
  ),
  default: (st: string | null | undefined): ReactNode => (
    <Tooltip withArrow label={`Unknown${st ? `: ${st}` : ""}`}>
      <IconQuestionMark {...stateIconStyle} />
    </Tooltip>
  ),
} as const;

type NonDefaultState = Exclude<keyof typeof states, "default">;

export const StateCell: FC<{ row: RadiusSession }> = ({ row }) => {
  return (
    <Center>
      {row.attributes?.State &&
      row.attributes.State in states &&
      row.attributes.State !== "default"
        ? states[row.attributes.State as NonDefaultState]
        : states.default(row.attributes?.State)}
    </Center>
  );
};
