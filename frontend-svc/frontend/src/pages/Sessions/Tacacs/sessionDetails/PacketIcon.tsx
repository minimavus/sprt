import { type FC } from "react";
import {
  Icon,
  IconAlertTriangle,
  IconArrowBigLeft,
  IconCancel,
  IconCheck,
  IconHourglassEmpty,
  IconRefresh,
} from "@tabler/icons-react";

import type { SessionFlow } from "@/hooks/sessions/schemas";

import { isNonEmptyPacket, isTacacsPacket } from "./guards";

const typeMap = new Map<string, Icon>([
  ["TAC_PLUS_AUTHEN_STATUS_PASS", IconCheck],
  ["TAC_PLUS_ACCT_STATUS_SUCCESS", IconCheck],
  ["TAC_PLUS_AUTHOR_STATUS_PASS_ADD", IconCheck],
  ["TAC_PLUS_AUTHOR_STATUS_PASS_REPL", IconCheck],

  ["TAC_PLUS_AUTHOR_STATUS_FAIL", IconCancel],
  ["TAC_PLUS_AUTHEN_STATUS_FAIL", IconCancel],
  ["TAC_PLUS_ACCT_STATUS_FAIL", IconCancel],

  ["TAC_PLUS_AUTHOR_STATUS_ERROR", IconCancel],
  ["TAC_PLUS_AUTHEN_STATUS_ERROR", IconCancel],
  ["TAC_PLUS_ACCT_STATUS_ERROR", IconCancel],

  ["TAC_PLUS_AUTHOR_STATUS_FOLLOW", IconRefresh],
  ["TAC_PLUS_AUTHEN_STATUS_FOLLOW", IconRefresh],
  ["TAC_PLUS_ACCT_STATUS_FOLLOW", IconRefresh],

  ["TAC_PLUS_AUTHEN_STATUS_GETDATA", IconHourglassEmpty],
  ["TAC_PLUS_AUTHEN_STATUS_GETUSER", IconHourglassEmpty],
  ["TAC_PLUS_AUTHEN_STATUS_GETPASS", IconHourglassEmpty],
]);

function getIconForPacketCode(pType: number, code: string): Icon {
  if (pType === 1) {
    return IconArrowBigLeft;
  }

  return typeMap.has(code) ? typeMap.get(code) : IconAlertTriangle;
}

export const PacketIcon: FC<{ packet: SessionFlow["packets"][number] }> = ({
  packet,
}) => {
  const IconElement = getIconForPacketCode(
    packet.radius.type,
    isTacacsPacket(packet.radius.packet) &&
      isNonEmptyPacket(packet.radius.packet)
      ? packet.radius.packet.body.status
      : packet.radius.code,
  );

  return <IconElement size={16} stroke={1.5} />;
};
