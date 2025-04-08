import { Fragment, useMemo, type FC } from "react";
import {
  Button,
  Card,
  Code,
  Collapse,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import cx from "classnames";

import { styles } from "@/components/CardGrid";
import { HexEditor } from "@/components/HexEditor";
import { Table } from "@/components/Table";
import { Timeline, TimelineElement } from "@/components/Timeline";
import { RadiusAttribute, SessionFlow } from "@/hooks/sessions/schemas";
import { hexEncode, toUint8Array } from "@/utils/strings";

import { getStatusForPacketCode } from "./getStatusForPacketCode";
import { PacketIcon } from "./PacketIcon";
import { TimeDiff } from "./TimeDiff";

const rawPackets = [
  "HTTP_REQUEST",
  "HTTP_RESPONSE",
  "GUEST_SUCCESS",
  "GUEST_FAILURE",
  "GUEST_REGISTERED",
];

const isEmptyPacket = (
  packet: SessionFlow["packets"][number]["radius"]["packet"],
) => {
  if (!packet || (Array.isArray(packet) && packet.length === 0)) {
    return true;
  }

  return !Object.values(packet).some(
    (v) => v !== null && v !== undefined && v !== "",
  );
};

const VSA: FC<{ vsa: RadiusAttribute }> = ({ vsa }) => {
  if (!vsa.nested) {
    return null;
  }

  return (
    <dl className="dl--inline-centered">
      {vsa.nested.map((e, idx) => (
        <Fragment key={idx}>
          <dt>{e.name}</dt>
          <dd>{e.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
};

const rawAttributes = new Set([
  "EAP-Message",
  "MS-MPPE-Recv-Key",
  "MS-MPPE-Send-Key",
]);

const isRawAttribute = (name: string | null | undefined) => {
  if (!name) {
    return false;
  }
  return rawAttributes.has(name);
};

const ValueFormatter = ({ attribute }: { attribute: RadiusAttribute }) => {
  const memoisedUint8Array = useMemo(() => {
    if (!attribute || !attribute.value || !isRawAttribute(attribute.name)) {
      return null;
    }
    return toUint8Array(attribute.value.toString());
  }, [attribute.value]);

  if (!attribute || attribute.value === undefined || attribute.value === null) {
    return null;
  }

  switch (attribute.name) {
    case "Message-Authenticator":
    case "CHAP-Password":
      return <Code>{hexEncode(attribute.value.toString()).join(" ")}</Code>;
    case "EAP-Message":
    case "MS-MPPE-Recv-Key":
    case "MS-MPPE-Send-Key":
      // return <Code block>{hexDump(attribute.value.toString())}</Code>;
      return (
        <HexEditor
          data={memoisedUint8Array!}
          height={(Math.ceil(memoisedUint8Array!.length / 0x10) + 1) * 25}
          readOnly
          showColumnLabels={false}
          nonce={0}
        />
      );
    case "Vendor-Specific":
      return <VSA vsa={attribute} />;
    default:
      return attribute.value;
  }
};

const attributesTableColumns: ColumnDef<RadiusAttribute>[] = [
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
  packet: Extract<
    NonNullable<SessionFlow["packets"][number]["radius"]["packet"]>,
    Array<any>
  >;
}> = ({ packet }) => {
  const [isOpen, { toggle }] = useDisclosure();

  return (
    <>
      <Collapse in={isOpen}>
        <Table
          columns={attributesTableColumns}
          data={packet}
          pagination={false}
          enableSorting={false}
        />
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

const RawPacket: FC<{
  packet: Extract<
    SessionFlow["packets"][number]["radius"]["packet"],
    Array<any>
  >;
}> = ({ packet }) => {
  const [isOpen, { toggle }] = useDisclosure();

  return (
    <>
      <Collapse in={isOpen}>
        <Code
          block
          style={{
            wordBreak: "break-all",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {packet[0].value}
        </Code>
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

const Packet: FC<{
  packet: SessionFlow["packets"][number];
  previousPacketTs: number;
}> = ({ packet, previousPacketTs }) => {
  const diff =
    (packet.radius.time - (previousPacketTs || packet.radius.time)) * 1_000_000;

  const status = getStatusForPacketCode(packet.radius.type, packet.radius.code);

  return (
    <TimelineElement
      icon={<PacketIcon packet={packet} />}
      status={status}
      key={packet.order}
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
                {packet.radius.code}
              </Text>
              <Text span> at {packet.radius.formattedDateTime}</Text>
            </div>
            {packet.radius.server?.address ? (
              <Text span>From {packet.radius.server.address}</Text>
            ) : null}
          </Group>
          {Array.isArray(packet.radius.packet) &&
          packet.radius.packet.length > 0 ? (
            isEmptyPacket(packet.radius.packet) ? null : rawPackets.includes(
                packet.radius.code,
              ) ? (
              <RawPacket packet={packet.radius.packet} />
            ) : (
              <Attributes packet={packet.radius.packet} />
            )
          ) : null}
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
