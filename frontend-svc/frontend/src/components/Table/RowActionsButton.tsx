import { ActionIcon } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";
import { forwardRef } from "react";

export const RowActionsButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      aria-label="Actions"
      ref={ref}
      {...props}
    >
      <IconDotsVertical size={18} />
    </ActionIcon>
  );
});
