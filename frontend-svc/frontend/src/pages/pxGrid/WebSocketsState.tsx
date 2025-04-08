import { type FC } from "react";
import { Text } from "@mantine/core";

import type { PxGridConnection } from "@/hooks/pxgrid/schemas";
import { usePxGridConnectionTopics } from "@/hooks/pxgrid/topics";
import { useQueryUser } from "@/hooks/useQueryUser";

export const WebSocketsState: FC<{ connection: PxGridConnection }> = ({
  connection,
}) => {
  const [user] = useQueryUser();
  const { data } = usePxGridConnectionTopics(connection.id, user);

  const up = data
    ? data.subscriptions?.some((subscription) => subscription.connected)
    : false;

  if (up) {
    return (
      <Text span c="green">
        UP
      </Text>
    );
  }

  return (
    <Text span c="red">
      DOWN
    </Text>
  );
};
