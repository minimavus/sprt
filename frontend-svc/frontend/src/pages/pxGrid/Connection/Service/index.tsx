import { type FC, type ReactNode } from "react";
import {
  Anchor,
  Button,
  Code,
  Collapse,
  Divider,
  Group,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconExternalLink } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { KeyValue } from "@/components/KeyValue";
import { DefaultLoaderFallback } from "@/components/Loader";
import {
  type PxGridService,
  type PxGridServiceOverview,
} from "@/hooks/pxgrid/schemas";
import {
  usePxGridConnectionService,
  usePxGridConnectionServices,
} from "@/hooks/pxgrid/services";
import { useQueryUser } from "@/hooks/useQueryUser";
import { isNotNilNorEmpty } from "@/utils/guards/isNotNilNorEmpty";

import { hasTopics } from "./has";
import { ServiceDetails } from "./ServiceActions";
import { TopicsBody } from "./TopicsBody";

const composeServiceNodePairs = (
  node: NonNullable<NonNullable<PxGridService["lookup"]>["nodes"]>[number],
): [string, ReactNode][] => {
  return Object.entries(node).map(([key, value]) => [
    key,
    typeof value === "object" ? (
      <>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <Code>{k}</Code>
            <Code>: {v}</Code>
          </div>
        ))}
      </>
    ) : (
      value
    ),
  ]);
};

const ServiceNodes: FC<{
  nodes: NonNullable<NonNullable<PxGridService["lookup"]>["nodes"]>;
}> = ({ nodes }) => {
  return (
    <Tabs
      defaultValue={nodes.length > 0 ? nodes[0].node_name : null}
      orientation="vertical"
    >
      <Tabs.List>
        {nodes.map((node) => (
          <Tabs.Tab key={node.node_name} value={node.node_name}>
            {node.node_name}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {nodes.map((node) => (
        <Tabs.Panel key={node.node_name} value={node.node_name} pl="sm">
          <KeyValue
            pairs={composeServiceNodePairs(node) as any}
            placement="above"
          />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};

const LookupData: FC<{ lookupData: NonNullable<PxGridService["lookup"]> }> = ({
  lookupData,
}) => {
  const [opened, { toggle }] = useDisclosure(false);
  return (
    <>
      <Collapse in={opened}>
        {isNotNilNorEmpty(lookupData.nodes) ? (
          <ServiceNodes nodes={lookupData.nodes} />
        ) : (
          <Text>No nodes providing this service</Text>
        )}
      </Collapse>
      <div>
        <Button
          onClick={toggle}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: opened ? "rotate(-180deg)" : "none" }}
            />
          }
          variant="subtle"
          size="compact-xs"
        >
          {opened ? "Hide Lookup Data" : "Show Lookup Data"}
        </Button>
      </div>
    </>
  );
};

const ServiceOverview: FC<{
  serviceName: string;
  lookupData: PxGridService["lookup"];
  fancy?: PxGridServiceOverview;
}> = ({ serviceName, lookupData, fancy }) => {
  return (
    <>
      <Title order={5}>{fancy?.display_name ?? fancy?.friendly_name}</Title>
      {fancy ? (
        <>
          {fancy.description ? <Text>{fancy.description}</Text> : null}
          <Group gap="xs">
            <Text span>
              Service: <Code>{fancy.friendly_name}</Code>
            </Text>
            {fancy.wiki ? (
              <>
                <Text span> / </Text>
                <Anchor href={fancy.wiki} target="_blank">
                  Wiki <IconExternalLink size={14} />
                </Anchor>
              </>
            ) : null}
          </Group>
        </>
      ) : (
        <Text>Service: {serviceName} / No service data available</Text>
      )}
      {isNotNilNorEmpty(lookupData) ? (
        <LookupData lookupData={lookupData} />
      ) : (
        <Text>No lookup data available</Text>
      )}
    </>
  );
};

export const Service: FC = () => {
  const [user] = useQueryUser();
  const { id, service } = useParams<{ id: string; service: string }>();
  const { data: services } = usePxGridConnectionServices(id!, user);

  const { data, error, status, refetch } = usePxGridConnectionService(
    id!,
    user,
    service!,
  );

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error") {
    return <DisplayError error={error} onReset={() => refetch()} />;
  }

  const fancy = services?.find((s) => s.friendly_name === service);

  return (
    <>
      <ServiceOverview
        serviceName={service!}
        lookupData={data.lookup}
        fancy={fancy}
      />
      <ServiceDetails serviceName={service!} service={data} />
      {hasTopics(data) ? (
        <>
          <Divider />
          <TopicsBody serviceName={service!} service={data} />
        </>
      ) : null}
    </>
  );
};
