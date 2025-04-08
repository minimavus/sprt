import { FC } from "react";
import { Card, Group, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import cx from "classnames";

import { styles } from "@/components/CardGrid";
import { useFixedLink } from "@/components/Link/useFixedLink";

export const NewConsumerCard: FC = () => {
  const { onClick } = useFixedLink("/pxgrid/add");
  return (
    <Card
      withBorder
      className={cx(styles.card, styles.clickable)}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={onClick as any}
    >
      <Stack
        gap="sm"
        flex={1}
        justify="center"
        style={{ width: "100%", textDecoration: "none" }}
      >
        <Group justify="center">
          <IconPlus size={24} />
        </Group>
        <Group justify="center">
          <Text>Add new connection</Text>
        </Group>
      </Stack>
    </Card>
  );
};
