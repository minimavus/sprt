import type { TimelineElementStatus } from "@/components/Timeline";

const statusForPacketCode: Record<string, TimelineElementStatus> & {
  default: TimelineElementStatus;
} = {
  TAC_PLUS_AUTHEN_STATUS_PASS: "positive",
  TAC_PLUS_ACCT_STATUS_SUCCESS: "positive",
  TAC_PLUS_AUTHOR_STATUS_PASS_ADD: "positive",
  TAC_PLUS_AUTHOR_STATUS_PASS_REPL: "positive",
  TAC_PLUS_AUTHOR_STATUS_FAIL: "negative",
  TAC_PLUS_AUTHEN_STATUS_FAIL: "negative",
  TAC_PLUS_ACCT_STATUS_FAIL: "negative",
  TAC_PLUS_AUTHOR_STATUS_ERROR: "negative",
  TAC_PLUS_AUTHEN_STATUS_ERROR: "negative",
  TAC_PLUS_ACCT_STATUS_ERROR: "negative",
  TAC_PLUS_AUTHOR_STATUS_FOLLOW: "info",
  TAC_PLUS_AUTHEN_STATUS_FOLLOW: "info",
  TAC_PLUS_ACCT_STATUS_FOLLOW: "info",
  TAC_PLUS_AUTHEN_STATUS_GETDATA: "info",
  TAC_PLUS_AUTHEN_STATUS_GETUSER: "info",
  TAC_PLUS_AUTHEN_STATUS_GETPASS: "info",
  TAC_PLUS_AUTHEN_STATUS_RESTART: "warning",
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
