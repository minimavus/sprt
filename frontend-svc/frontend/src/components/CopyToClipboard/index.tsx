import {
  ActionIcon,
  type ActionIconProps,
  type FloatingPosition,
  rem,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { type FC, useEffect } from "react";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { toast } from "@/utils/toasts";

type CopyToClipboardProps = {
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
  tooltipPosition?: FloatingPosition;
} & ActionIconProps;

export const CopyToClipboard: FC<CopyToClipboardProps> = ({
  value,
  copiedLabel = "Copied",
  copyLabel = "Copy",
  tooltipPosition = "right",
  ...props
}) => {
  const clipboard = useCopyToClipboard({ timeout: 1000 });

  useEffect(() => {
    if (clipboard.error) {
      log.error(clipboard.error, "Clipboard error");
      toast.error({
        title: "Error",
        message: getErrorMessage(clipboard.error),
      });
    }
  }, [clipboard.error]);

  return (
    <Tooltip
      label={clipboard.copied ? copiedLabel : copyLabel}
      withArrow
      position={tooltipPosition}
    >
      <ActionIcon
        color={clipboard.copied ? "teal" : "gray"}
        variant="subtle"
        onClick={() => clipboard.copy(value)}
        {...props}
      >
        {clipboard.copied ? (
          <IconCheck style={{ width: rem(16) }} />
        ) : (
          <IconCopy style={{ width: rem(16) }} />
        )}
      </ActionIcon>
    </Tooltip>
  );
};
