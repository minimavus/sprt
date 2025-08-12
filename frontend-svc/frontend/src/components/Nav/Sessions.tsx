import { Badge, Group, Loader, Tooltip } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { type FC, useEffect } from "react";

import { Info } from "@/components/Alerts";
import { DisplayError } from "@/components/Error";
import {
  getSessionsSummaryKeyAndEnsureDefaults,
  useSessionsSummary,
} from "@/hooks/sessions";
import type { ServerWithSessions } from "@/hooks/sessions/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import type { Protos } from "@/hooks/zodProto";
import { log } from "@/utils/log";

import { NavSubDivider, NavSubLink, NavSubSection } from "./NavSubLink";
import type { SubMenuComponentProps } from "./types";

const ServerLink: FC<{
  server: ServerWithSessions;
  proto: Protos;
  asMenu: boolean;
}> = ({ server, proto, asMenu }) => {
  const to = `/sessions/${proto}/${server.server}`;

  return (
    <NavSubLink
      href={to}
      asMenu={asMenu}
      suffix={
        <Tooltip
          label={`Sessions: ${server.sessionscount}`}
          position="right"
          withArrow
        >
          <Badge size="sm" variant="filled">
            {server.sessionscount > 99 ? "99+" : server.sessionscount}
          </Badge>
        </Tooltip>
      }
    >
      {server.friendly_name
        ? `${server.friendly_name} (${server.server})`
        : server.server}
    </NavSubLink>
  );
};

const Servers: FC<{
  servers: ServerWithSessions[] | undefined | null;
  proto: Protos;
  asMenu: boolean;
}> = ({ servers, proto, asMenu }) => {
  if (!servers) {
    return (
      <Info variant="transparent" p="xs" ml={asMenu ? undefined : "xl"}>
        No sessions
      </Info>
    );
  }

  return (
    <>
      {servers?.map((server) => (
        <ServerLink
          key={server.server}
          server={server}
          proto={proto}
          asMenu={asMenu}
        />
      ))}
    </>
  );
};

export const Sessions: FC<SubMenuComponentProps> = ({ asMenu }) => {
  const [user] = useQueryUser();
  const { data, isLoading, error } = useSessionsSummary({ user });
  const qc = useQueryClient();

  useEffect(() => {
    return () => {
      qc.invalidateQueries({
        queryKey: getSessionsSummaryKeyAndEnsureDefaults(user),
      }).catch(log.error);
    };
  }, []);

  return (
    <>
      <NavSubSection asMenu={asMenu}>RADIUS</NavSubSection>
      {isLoading && (
        <Group justify="center">
          <Loader color="blue" type="dots" size="sm" />
        </Group>
      )}

      {error && <DisplayError error={error} before={null} />}
      {!isLoading && (
        <Servers servers={data?.radius} proto="radius" asMenu={asMenu} />
      )}

      <NavSubDivider asMenu={asMenu} />
      <NavSubSection asMenu={asMenu}>TACACS+</NavSubSection>
      {isLoading && (
        <Group justify="center">
          <Loader color="blue" type="dots" size="sm" />
        </Group>
      )}
      {error && <DisplayError error={error} before={null} />}
      {!isLoading && (
        <Servers servers={data?.tacacs} proto="tacacs" asMenu={asMenu} />
      )}
    </>
  );
};
