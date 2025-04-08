import { useMemo, type FC } from "react";
import {
  Button,
  Card,
  Collapse,
  Divider,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import cx from "classnames";

import { Warning } from "@/components/Alerts";
import { styles } from "@/components/CardGrid";
import { Table } from "@/components/Table";
import { Timeline, TimelineElement } from "@/components/Timeline";
import { SessionFlow, TacacsPacket } from "@/hooks/sessions/schemas";

import { TimeDiff } from "../../Radius/sessionDetails/TimeDiff";
import { getStatusForPacketCode } from "./getStatusForPacketCode";
import { isNonEmptyPacket } from "./guards";
import { PacketIcon } from "./PacketIcon";

type Attr = { value: string | number; name: string };

const ValueFormatter = ({ attribute }: { attribute: Attr }) => {
  // const memoisedUint8Array = useMemo(() => {
  //   if (!attribute || !attribute.value || !isRawAttribute(attribute.name)) {
  //     return null;
  //   }
  //   return toUint8Array(attribute.value.toString());
  // }, [attribute.value]);

  if (!attribute || attribute.value === undefined || attribute.value === null) {
    return null;
  }

  return attribute.value.toString();
};

const headersTableColumns: ColumnDef<Attr>[] = [
  {
    id: "Name",
    header: "Header",
    accessorKey: "name",
    enableColumnFilter: false,
    enableSorting: false,
    className: "no-break-word",
  },
  {
    id: "Value",
    header: "Value",
    accessorKey: "value",
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ row }) => <ValueFormatter attribute={row.original} />,
  },
];

const attributesTableColumns: ColumnDef<Attr>[] = [
  {
    id: "Name",
    header: "Attribute",
    accessorKey: "name",
    enableColumnFilter: false,
    enableSorting: false,
    className: "no-break-word",
  },
  {
    id: "Value",
    header: "Value",
    accessorKey: "value",
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ row }) => <ValueFormatter attribute={row.original} />,
  },
];

const Attributes: FC<{
  packet: TacacsPacket;
}> = ({ packet }) => {
  const [isOpen, { toggle }] = useDisclosure();
  const data = useMemo(() => {
    const r = {
      body: [] as Attr[],
      header: [] as Attr[],
    };

    if (!isNonEmptyPacket(packet)) {
      return r;
    }

    r.body = Object.entries(packet?.body).map(([name, value]) => ({
      name,
      value,
    }));
    r.header = Object.entries(packet?.header).map(([name, value]) => ({
      name,
      value,
    }));

    return r;
  }, [packet]);

  return (
    <>
      <Collapse in={isOpen}>
        {data.header.length > 0 ? (
          <>
            <Divider label="Headers" labelPosition="left" mt="sm" />
            <Table
              columns={headersTableColumns}
              data={data.header}
              pagination={false}
              enableSorting={false}
            />
          </>
        ) : null}
        {data.body.length > 0 ? (
          <>
            <Divider label="Attributes" labelPosition="left" mt="sm" />
            <Table
              columns={attributesTableColumns}
              data={data.body}
              pagination={false}
              enableSorting={false}
            />
          </>
        ) : null}
      </Collapse>
      <Card.Section
        inheritPadding
        py="xs"
        bg="var(--mantine-color-gray-light)"
        withBorder
      >
        <Button
          size="compact-xs"
          onClick={toggle}
          variant="subtle"
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          {isOpen ? "Hide" : "Show"} packet body
        </Button>
      </Card.Section>
    </>
  );
};

const Err: FC<{ code: string; err: string | undefined | null }> = ({
  code,
  err,
}) => {
  if (!err || code !== "ERROR") {
    return null;
  }
  return <Warning>{err}</Warning>;
};

const Packet: FC<{
  packet: SessionFlow["packets"][number];
  previousPacketTs: number;
}> = ({ packet: entity, previousPacketTs }) => {
  const diff =
    (entity.radius.time - (previousPacketTs || entity.radius.time)) * 1_000_000;
  const packet = entity.radius.packet as TacacsPacket;
  const code = packet?.body?.status || entity.radius.code;

  const status = getStatusForPacketCode(entity.radius.type, code);

  return (
    <TimelineElement
      icon={<PacketIcon packet={entity} />}
      status={status}
      key={entity.order}
    >
      {previousPacketTs !== undefined ? <TimeDiff diff={diff} /> : null}
      <Card
        className={cx(styles.card, styles.interactive)}
        withBorder
        shadow="sm"
      >
        <Stack gap="xs">
          <Group gap="xs" justify="space-between">
            <div>
              <Text className={cx(`text-${status}`)} fw="bold" span>
                {code}
              </Text>
              <Text span> at {entity.radius.formattedDateTime}</Text>
            </div>
            {entity.radius.server?.IP ? (
              <Text span>From {entity.radius.server.IP}</Text>
            ) : null}
          </Group>
          <Err err={entity.radius.message} code={entity.radius.code} />
          {isNonEmptyPacket(packet) ? <Attributes packet={packet} /> : null}
        </Stack>
      </Card>
    </TimelineElement>
  );
};

export const Flow: FC<{ flow: SessionFlow }> = ({ flow }) => {
  return (
    <Timeline gap="sm" flex={1}>
      {flow.packets.map((packet, idx) => {
        return (
          <Packet
            key={idx}
            packet={packet}
            previousPacketTs={flow.packets[idx - 1]?.radius.time}
          />
        );
      })}
    </Timeline>
  );
};
