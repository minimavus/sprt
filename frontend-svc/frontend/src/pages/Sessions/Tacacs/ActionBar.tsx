import { type FC } from "react";
import { Group } from "@mantine/core";
import cx from "classnames";

import styles from "../Sessions.module.scss";
import { RemoveActions } from "./actionBar/RemoveActions";
import type { ActionsProps } from "./types";

type ActionBarProps = Pick<ActionsProps, "selected"> & { collapsed?: boolean };

export const ActionBar: FC<ActionBarProps> = ({
  selected,
  collapsed = false,
}) => {
  return (
    <Group
      flex={1}
      justify="flex-end"
      className={cx({ [styles["actions--collapsed"]]: collapsed })}
      gap="xs"
      wrap="nowrap"
    >
      <RemoveActions selected={selected} collapsed={collapsed} />
    </Group>
  );
};
