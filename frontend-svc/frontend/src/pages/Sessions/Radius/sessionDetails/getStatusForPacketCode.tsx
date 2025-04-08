import type { TimelineElementStatus } from "@/components/Timeline";

const statusForPacketCode: Record<string, TimelineElementStatus> & {
  default: TimelineElementStatus;
} = {
  ACCESS_ACCEPT: "positive",
  ACCOUNTING_RESPONSE: "positive",
  COA_REQUEST: "positive",
  GUEST_SUCCESS: "positive",
  GUEST_REGISTERED: "positive",
  ACCESS_CHALLENGE: "info",
  HTTP_RESPONSE: "info",
  DISCONNECT_REQUEST: "warning",
  default: "negative",
};

export function getStatusForPacketCode(
  pType: number,
  code: string,
): TimelineElementStatus {
  if (pType === 1) {
    return "dormant";
  }

  return statusForPacketCode[code] || statusForPacketCode.default;
}
