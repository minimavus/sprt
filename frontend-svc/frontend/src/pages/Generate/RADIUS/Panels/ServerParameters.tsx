import { Fragment, type FC } from "react";
import {
  Badge,
  Button,
  Grid,
  Group,
  Menu,
  NumberInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconChevronDown, IconForbid2 } from "@tabler/icons-react";
import { Controller, useWatch } from "react-hook-form";

import { Info } from "@/components/Alerts";
import { Link } from "@/components/Link";
import { Family } from "@/hooks/generate/schemas";
import { ServerSettings, useServersSettings } from "@/hooks/settings/servers";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

import type { RadiusForm } from "../form";
import { useNadFamily } from "../hooks/useNadFamily";
import { useSetServerCb } from "../hooks/useServerForm";

const CoABadge: FC<{ coa: boolean }> = ({ coa }) => (
  <Badge
    size="sm"
    color={coa ? "blue" : "gray"}
    variant="light"
    leftSection={coa ? <IconCheck size={14} /> : <IconForbid2 size={14} />}
  >
    {coa ? "CoA" : "No CoA"}
  </Badge>
);

const ServerLabel: FC<{ server: ServerSettings; family: Family }> = ({
  server,
  family,
}) => {
  const address =
    family === Family.IPv4 ? server.address : server.attributes?.v6_address;

  return (
    <>
      {server.attributes?.friendly_name ? (
        <>
          <Text span>{server.attributes.friendly_name}</Text>
          <Text span c="dimmed">
            {" "}
            / {address}
          </Text>
        </>
      ) : (
        <Text span>{address}</Text>
      )}
    </>
  );
};

const ungrouped = "[:ungrouped:]";

const ServerLoader: FC = () => {
  const [u] = useQueryUser();
  const { data, isLoading, error } = useServersSettings(u);

  const family = useNadFamily(u);

  const { setNewServer } = useSetServerCb();
  const [isMenuOpen, { open, close }] = useDisclosure();

  const grouped = data
    ?.filter((s) =>
      s.attributes?.radius && family === Family.IPv4
        ? Boolean(s.address)
        : Boolean(s.attributes?.v6_address),
    )
    .reduce((acc: [string, ServerSettings[]][], s) => {
      const group = s.group || ungrouped;
      const existing = acc.find(([g]) => g === group);
      if (existing) {
        existing[1].push(s);
      } else {
        acc.push([group, [s]]);
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const aName = a[0] === ungrouped ? "zzzz" : a[0];
      const bName = b[0] === ungrouped ? "zzzz" : b[0];
      return aName.localeCompare(bName);
    });

  return (
    <Menu onOpen={() => open()} onClose={() => close()}>
      <Menu.Target>
        <Button
          variant="subtle"
          size="compact-xs"
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          Load
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {isLoading ? (
          <Menu.Item>Loading...</Menu.Item>
        ) : error ? (
          <Menu.Item>Error loading servers</Menu.Item>
        ) : grouped?.length ? (
          grouped.map(([group, servers], idx) =>
            group === ungrouped ? (
              <Fragment key={group}>
                {idx > 0 && <Menu.Divider />}
                <Menu.Label>
                  {group === ungrouped ? "Ungrouped" : group}
                </Menu.Label>
                {servers.map((s) => (
                  <Menu.Item
                    key={s.id}
                    onClick={() => {
                      setNewServer(s, family);
                    }}
                    rightSection={<CoABadge coa={s.coa} />}
                  >
                    <ServerLabel server={s} family={family} />
                  </Menu.Item>
                ))}
              </Fragment>
            ) : (
              <Menu.Sub>
                <Menu.Sub.Target>
                  <Menu.Sub.Item>{group}</Menu.Sub.Item>
                </Menu.Sub.Target>
                <Menu.Sub.Dropdown>
                  {servers.map((s) => (
                    <Menu.Item
                      key={s.id}
                      onClick={() => {
                        setNewServer(s, family);
                      }}
                      rightSection={<CoABadge coa={s.coa} />}
                    >
                      <ServerLabel server={s} family={family} />
                    </Menu.Item>
                  ))}
                </Menu.Sub.Dropdown>
              </Menu.Sub>
            ),
          )
        ) : (
          <Menu.Item>No servers found</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export const ServerParameters: FC = () => {
  const { dropLoaded } = useSetServerCb();

  const isLoaded = Boolean(
    useWatch<RadiusForm, "general.server.loadedId">({
      name: "general.server.loadedId",
    }),
  );

  const [u] = useQueryUser();
  const family = useNadFamily(u);

  return (
    <Stack gap="sm">
      <Group mt="lg" gap="sm">
        <Title order={3}>Server</Title>
        <ServerLoader />
        {family ? (
          <Group flex={1} justify="flex-end">
            <Badge size="sm" tt="none">
              IPv{family}
            </Badge>
          </Group>
        ) : null}
      </Group>
      <Info>
        CoA and Guest are supported only for{" "}
        <Link to="/settings/servers">saved servers</Link> which have "Handle
        Dynamic Authorization" enabled.
      </Info>
      <Controller<RadiusForm, "general.server.address">
        name="general.server.address"
        render={({ field: { onChange, ...field }, fieldState: { error } }) => (
          <TextInput
            {...field}
            onChange={(e) => {
              dropLoaded();
              onChange(e);
            }}
            label="Address"
            error={getErrorMessage(error)}
            id="address"
          />
        )}
      />
      <Grid gutter="xs">
        <Grid.Col span={6}>
          <Controller<RadiusForm, "general.server.authPort">
            name="general.server.authPort"
            render={({
              field: { onChange, ...field },
              fieldState: { error },
            }) => (
              <NumberInput
                {...field}
                onChange={(e) => {
                  dropLoaded();
                  onChange(e);
                }}
                label="Authentication Port"
                error={getErrorMessage(error)}
                id="auth-port"
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Controller<RadiusForm, "general.server.acctPort">
            name="general.server.acctPort"
            render={({
              field: { onChange, ...field },
              fieldState: { error },
            }) => (
              <NumberInput
                {...field}
                onChange={(e) => {
                  dropLoaded();
                  onChange(e);
                }}
                label="Accounting Port"
                error={getErrorMessage(error)}
                id="acct-port"
              />
            )}
          />
        </Grid.Col>
      </Grid>
      <Controller<RadiusForm, "general.server.secret">
        name="general.server.secret"
        render={({ field: { onChange, ...field }, fieldState: { error } }) => (
          <TextInput
            {...field}
            onChange={(e) => {
              dropLoaded();
              onChange(e);
            }}
            label="Shared secret"
            error={getErrorMessage(error)}
            id="shared-secret"
          />
        )}
      />
      {isLoaded ? null : (
        <Controller<RadiusForm, "general.server.save">
          name="general.server.save"
          render={({ field: { value, onChange, ...field } }) => (
            <Switch
              {...field}
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              id="save-server"
              label="Save server if it does not exist"
            />
          )}
        />
      )}
    </Stack>
  );
};
