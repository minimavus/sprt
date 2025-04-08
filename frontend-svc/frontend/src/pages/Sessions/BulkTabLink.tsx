import { FC } from "react";
import { Badge, Tabs, Tooltip } from "@mantine/core";

import { useFixedLink } from "@/components/Link/useFixedLink";
import { Protos } from "@/hooks/zodProto";

import type { ResolvedServerData } from "./types";

export const BulkTabLink: FC<{
  server: string;
  bulk: NonNullable<NonNullable<ResolvedServerData>["bulks"]>[number];
  proto: Protos;
}> = ({ server, bulk, proto }) => {
  const { onClick, ...props } = useFixedLink(
    `/sessions/${proto}/${server}/${bulk.name}`,
  );

  return (
    <Tabs.Tab
      key={bulk.name}
      component="a"
      rightSection={
        <Tooltip
          label={`Sessions: ${bulk.sessions}`}
          position="right"
          withArrow
        >
          <Badge size="sm" variant="filled">
            {bulk.sessions > 99 ? "99+" : bulk.sessions}
          </Badge>
        </Tooltip>
      }
      value={bulk.name!}
      display="flex"
      style={{ justifyContent: "space-between" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e as any);
      }}
      {...props}
    >
      {bulk.name && bulk.name !== "none" ? bulk.name : "Non-bulked"}
    </Tabs.Tab>
  );
};
