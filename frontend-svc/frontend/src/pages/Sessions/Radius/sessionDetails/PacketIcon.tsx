import { type FC } from "react";
import {
  Icon,
  IconAlertHexagon,
  IconArrowBigLeft,
  IconArrowBigRight,
} from "@tabler/icons-react";

import { SessionFlow } from "@/hooks/sessions/schemas";

const iconForPacketCode: Record<string, Icon> & {
  default: Icon;
} = {
  ACCESS_ACCEPT: IconArrowBigRight,
  ACCOUNTING_RESPONSE: IconArrowBigRight,
  COA_REQUEST: IconArrowBigRight,
  GUEST_SUCCESS: IconArrowBigRight,
  GUEST_REGISTERED: IconArrowBigRight,
  ACCESS_CHALLENGE: IconArrowBigRight,
  HTTP_RESPONSE: IconArrowBigRight,
  DISCONNECT_REQUEST: IconArrowBigRight,
  default: IconAlertHexagon,
};

function getIconForPacketCode(pType: number, code: string): Icon {
  if (pType === 1) {
    return IconArrowBigLeft;
  }

  return iconForPacketCode[code] || iconForPacketCode.default;
}

export const PacketIcon: FC<{ packet: SessionFlow["packets"][number] }> = ({
  packet,
}) => {
  const IconElement = getIconForPacketCode(
    packet.radius.type,
    packet.radius.code,
  );
  return <IconElement size={16} stroke={1.5} />;
};
