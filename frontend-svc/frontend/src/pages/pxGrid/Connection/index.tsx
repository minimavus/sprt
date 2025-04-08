import { FC, ReactNode, Suspense } from "react";
import {
  Button,
  Center,
  Divider,
  Loader,
  rem,
  Stack,
  Title,
} from "@mantine/core";
import {
  IconArrowLeftDashed,
  IconBroadcast,
  IconCloud,
  IconLogs,
  IconMessages,
  IconSettings,
} from "@tabler/icons-react";
import { DefaultError } from "@tanstack/react-query";
import {
  Await,
  LoaderFunction,
  Outlet,
  useLoaderData,
  useMatch,
  useParams,
} from "react-router-dom";

import { Columns, ColumnSection, Left, Right } from "@/components/Columns";
import { AwaitError, DisplayError } from "@/components/Error";
import { KeyValue } from "@/components/KeyValue";
import { PageLayout } from "@/components/Layout/PageLayout";
import { useFixedLink } from "@/components/Link/useFixedLink";
import { DefaultLoaderFallback } from "@/components/Loader";
import { NavbarLink } from "@/components/Nav";
import { NavSubLink } from "@/components/Nav/NavSubLink";
import classes from "@/components/Nav/styles.module.scss";
import { SubMenuComponentProps } from "@/components/Nav/types";
import {
  getOnePxGridConnectionKeyAndEnsureDefaults,
  usePxGridConnection,
} from "@/hooks/pxgrid";
import {
  CredentialsType,
  PxGridConnection,
  PxGridServiceOverview,
} from "@/hooks/pxgrid/schemas";
import { usePxGridConnectionServices } from "@/hooks/pxgrid/services";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";

import { ConsumerState } from "../ConsumerState";
import { WebSocketsState } from "../WebSocketsState";
import styles from "./Connection.module.scss";

type LoaderData = {
  connection: PxGridConnection | Promise<PxGridConnection>;
};

const ConsumerOverview: FC<{ connection: PxGridConnection }> = ({
  connection,
}) => {
  const items: [string, ReactNode][] = [
    ["Client name", connection.client_name],
    ["State", <ConsumerState state={connection.state} />],
    [
      "Auth method",
      connection.credentials.type === CredentialsType.Certificate
        ? "Certificate"
        : "Password",
    ],
    [
      "Nodes",
      <>
        {connection.nodes.map((node) => (
          <span key={node.fqdn}>{node.fqdn}</span>
        ))}
      </>,
    ],
    ["WebSockets", <WebSocketsState connection={connection} />],
  ];

  return <KeyValue pairs={items} placement="above" gap={rem(8)} />;
};

const ServiceMenuItem: FC<{ service: PxGridServiceOverview }> = ({
  service,
}) => {
  const { id, service: serviceName } = useParams<{
    id: string;
    service: string;
  }>();

  return (
    <NavSubLink
      active={service.friendly_name === serviceName}
      asMenu={false}
      {...useFixedLink(`/pxgrid/${id}/services/${service.friendly_name}`)}
    >
      {service.display_name ?? service.friendly_name}
    </NavSubLink>
  );
};

const ServicesSubMenu: FC<SubMenuComponentProps> = () => {
  const [user] = useQueryUser();
  const { id } = useParams<{ id: string; service: string }>();
  const { data, status, error } = usePxGridConnectionServices(id!, user);

  return status === "pending" ? (
    <Center>
      <Loader size="sm" type="dots" />
    </Center>
  ) : error ? (
    <div style={{ marginRight: "8px" }}>
      <DisplayError error={error} before={null} />
    </div>
  ) : (
    data.map((service) => (
      <ServiceMenuItem key={service.friendly_name} service={service} />
    ))
  );
};

const Consumer: FC<{ connection: PxGridConnection }> = ({ connection }) => {
  const [user] = useQueryUser();
  const { data: maybe } = usePxGridConnection(connection.id, user);
  const match = useMatch("/pxgrid/:id/:section");

  const data = maybe ?? connection;
  const linkBase = `/pxgrid/${connection.id}`;

  return (
    <Columns>
      <Left>
        <Stack gap="sm" className={styles.overview}>
          <Title order={4}>{data?.friendly_name}</Title>
          <ConsumerOverview connection={data} />
        </Stack>
        <ColumnSection>
          <Divider />
        </ColumnSection>
        <ColumnSection flex={1}>
          <Stack align="center" gap="0" className={classes.nav}>
            <NavbarLink
              label="Services"
              icon={IconCloud}
              collapsed={false}
              subMenu={ServicesSubMenu}
            />
            <NavbarLink
              label="Topics"
              icon={IconBroadcast}
              collapsed={false}
              active={match?.params.section === "topics"}
              {...useFixedLink(`${linkBase}/topics`, { target: "_self" })}
            />
            <NavbarLink
              label="Messages"
              icon={IconMessages}
              collapsed={false}
              active={match?.params.section === "messages"}
              {...useFixedLink(`${linkBase}/messages`, { target: "_self" })}
            />
            <NavbarLink
              label="Logs"
              icon={IconLogs}
              collapsed={false}
              active={match?.params.section === "logs"}
              {...useFixedLink(`${linkBase}/logs`, { target: "_self" })}
            />
            <NavbarLink
              label="Settings"
              icon={IconSettings}
              collapsed={false}
              active={match?.params.section === "settings"}
              {...useFixedLink(`${linkBase}/settings`, { target: "_self" })}
            />
          </Stack>
        </ColumnSection>
        <div className={styles.button_back}>
          <Button
            component="a"
            {...useFixedLink("/pxgrid", { target: "_self" })}
            leftSection={<IconArrowLeftDashed size={14} />}
            variant="subtle"
            size="compact-sm"
          >
            Back to consumers
          </Button>
        </div>
      </Left>
      <Right>
        <Stack gap="sm">
          <Outlet />
        </Stack>
      </Right>
    </Columns>
  );
};

const Page: FC = () => {
  const data = useLoaderData() as LoaderData;

  return (
    <PageLayout title="pxGrid Consumer" fullHeight={false}>
      <Suspense fallback={<DefaultLoaderFallback />}>
        <Await
          resolve={data.connection}
          errorElement={<AwaitError before={null} />}
        >
          {(connection) => <Consumer connection={connection} />}
        </Await>
      </Suspense>
    </PageLayout>
  );
};

export { Page as PxGridConnectionPage };

export const pxGridConnectionLoader: LoaderFunction = async ({
  params,
  request,
}) => {
  const user = new URL(request.url).searchParams.get("user");
  const queryKey = getOnePxGridConnectionKeyAndEnsureDefaults(params.id!, user);

  return {
    connection: queryClient.ensureQueryData<
      unknown,
      DefaultError,
      PxGridConnection
    >({
      queryKey,
    }),
  } satisfies LoaderData;
};
