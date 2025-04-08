import { FC } from "react";
import { Center, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCancel,
  IconQuestionMark,
  IconSquareCheck,
} from "@tabler/icons-react";

import { TacacsSession, TacacsSessionState } from "@/hooks/sessions/schemas";

import { stateIconStyle } from "../../styles";

const StateRejected = ({ st }: { st: TacacsSessionState }) => (
  <Tooltip withArrow label={`Rejected: ${st}`}>
    <IconCancel
      {...stateIconStyle}
      style={{ color: "var(--mantine-color-red-text)" }}
    />
  </Tooltip>
);

const StateAccepted = () => (
  <Tooltip withArrow label="Accepted">
    <IconSquareCheck
      {...stateIconStyle}
      style={{ color: "var(--mantine-color-green-text)" }}
    />
  </Tooltip>
);

const StateError = ({ st }: { st: TacacsSessionState }) => (
  <Tooltip withArrow label={`Error: ${st}`}>
    <IconAlertTriangle
      {...stateIconStyle}
      style={{ color: "var(--mantine-color-red-text)" }}
    />
  </Tooltip>
);

const StateUnknown = ({
  st,
}: {
  st: TacacsSessionState | string | null | undefined;
}) => (
  <Tooltip withArrow label={`Unknown${st ? `: ${st}` : ""}`}>
    <IconQuestionMark {...stateIconStyle} />
  </Tooltip>
);

const Switcher: FC<{ st: TacacsSessionState | null | undefined }> = ({
  st,
}) => {
  switch (st) {
    case "ACCEPTED":
    case "ACCEPTED_AUTHZ":
    case "ACCEPTED_ACCT":
      return <StateAccepted />;
    case "REJECTED":
    case "REJECTED_AUTHZ":
    case "REJECTED_ACCT":
      return <StateRejected st={st} />;
    case "ERROR_AUTHC":
    case "ERROR_AUTHZ":
    case "ERROR_ACCT":
      return <StateError st={st} />;
    default:
      return <StateUnknown st={st} />;
  }
};

export const SessionState: FC<{ row: TacacsSession }> = ({ row }) => {
  return (
    <Center>
      <Switcher st={row.attributes?.state} />
    </Center>
  );
};
