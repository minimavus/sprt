import { type FC } from "react";
import { Button, Divider, Group } from "@mantine/core";

import styles from "../Sessions.module.scss";
import { AccountingActions } from "./actionBar/AccountingActions";
import { ANCActions } from "./actionBar/ANCActions";
import { DropActions } from "./actionBar/DropActions";
import { GuestActions } from "./actionBar/GuestActions";
import { RemoveActions } from "./actionBar/RemoveActions";
import { ActionsProps } from "./types";

type ActionBarProps = Pick<ActionsProps, "selected"> & { collapsed?: boolean };

export const ActionBar: FC<ActionBarProps> = ({
  selected,
  collapsed = false,
}) => {
  return (
    <Group
      flex={1}
      justify="flex-end"
      className={collapsed ? styles["actions--collapsed"] : undefined}
      gap="xs"
      wrap="nowrap"
    >
      <Button.Group>
        <AccountingActions selected={selected} collapsed={collapsed} />
        <DropActions selected={selected} collapsed={collapsed} />
      </Button.Group>
      <Divider orientation="vertical" />
      <Button.Group>
        <GuestActions selected={selected} collapsed={collapsed} />
        <ANCActions selected={selected} collapsed={collapsed} />
      </Button.Group>
      <Divider orientation="vertical" />
      <RemoveActions selected={selected} collapsed={collapsed} />
    </Group>
  );
};
