import { FC } from "react";
import { Tooltip } from "@mantine/core";
import { IconHelpCircle } from "@tabler/icons-react";

import styles from "@/styles/TextInput.module.scss";

type InputHelpProps = {
  help: string;
};

export const InputHelp: FC<InputHelpProps> = ({ help }) => {
  return (
    <Tooltip label={help} w={300} withArrow multiline>
      <IconHelpCircle
        size={16}
        style={{ cursor: "help" }}
        className={styles["input-help"]}
      />
    </Tooltip>
  );
};
