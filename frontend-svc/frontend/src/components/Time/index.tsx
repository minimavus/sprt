import type { FC, ReactNode } from "react";
import { Tooltip } from "@mantine/core";
import {
  differenceInSeconds,
  format,
  formatDistanceToNow,
  parseISO,
} from "date-fns";

import { log } from "@/utils/log";

export const defaultFormat = "yyyy-MM-dd HH:mm:ss";
export const localized24hFormat = "PP @ HH:mm:ss";
export const localized24hFormatWithMillis = "PP @ HH:mm:ss.SSS";
export const ONE_MINUTE_SECONDS = 60;
export const ONE_HOUR_SECONDS = 60 * ONE_MINUTE_SECONDS;
export const HALF_HOUR_SECONDS = 30 * ONE_MINUTE_SECONDS;

const getDisplayFormat = (
  displayFormat: string | undefined,
  showTZ: boolean,
  showMillis: boolean,
) => {
  if (!displayFormat) {
    displayFormat = showMillis ? `${defaultFormat}.SSS` : defaultFormat;
    if (showTZ) {
      displayFormat += " (O)";
    }
  }
  return displayFormat;
};

const FormatTime: FC<{
  t?: Date | null | string;
  format?: string;
  showTZ?: boolean;
  showMillis?: boolean;
  noDatePlaceholder?: ReactNode;
  relative?: boolean;
  relativeBeforeSeconds?: number;
}> = ({
  t,
  format: displayFormat,
  showTZ = false,
  showMillis = false,
  noDatePlaceholder = "",
  relative = false,
  relativeBeforeSeconds = ONE_HOUR_SECONDS,
}) => {
  displayFormat = getDisplayFormat(displayFormat, showTZ, showMillis);

  let d: Date | undefined;
  try {
    d = t instanceof Date ? t : parseISO(t!);
  } catch (e) {
    log.error(e);
  }

  if (relative && d) {
    const now = new Date();
    const diff = differenceInSeconds(now, d);
    if (diff < relativeBeforeSeconds) {
      return (
        <Tooltip label={format(d, displayFormat)}>
          <span>{formatDistanceToNow(d, { addSuffix: true })}</span>
        </Tooltip>
      );
    }
  }

  return d ? format(d, displayFormat) : noDatePlaceholder;
};

export { FormatTime };
