import { FC } from "react";
import { Card, Code } from "@mantine/core";

export const Placeholders: FC = () => {
  return (
    <Card withBorder p={0}>
      <Code p="sm">
        Supported variables in Subject and SAN fields:
        <br />
        $IP$ - generated IP address
        <br />
        $MAC$ - MAC address for the session
        <br />
        $OWNER$ - Your UID
        <br />
        $USERNAME$ - RADIUS UserName
        <br />
      </Code>
    </Card>
  );
};
