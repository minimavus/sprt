import { useMemo, type FC } from "react";
import { Badge, Button, Stack, Text, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import {
  type PxGridServices,
  type PxGridServiceTopics,
  type PxGridSubscription,
} from "@/hooks/pxgrid/schemas";
import { usePxGridConnectionTopicSubscribe } from "@/hooks/pxgrid/topics";
import { useQueryUser } from "@/hooks/useQueryUser";

import styles from "./Topics.module.scss";

type SubscriptionsOfService = Record<string, PxGridSubscription>;
type PxGridTopic = PxGridServiceTopics[string];

const isSubscribed = (
  subs: SubscriptionsOfService | undefined,
  topic: PxGridTopic,
) => {
  if (!subs) {
    return false;
  }

  return Object.values(subs).some(
    (sub) => sub.destination === topic.destination,
  );
};

const SubscribeButton: FC<{
  topicName: string;
  topic: PxGridTopic;
  subscribed: boolean;
  service: string;
}> = ({ topicName, subscribed, service }) => {
  const { id } = useParams<{ id: string }>();
  const [user] = useQueryUser();
  const { mutate: manage, isPending } = usePxGridConnectionTopicSubscribe(
    id!,
    user,
  );

  return (
    <Button
      variant={subscribed ? "outline" : "primary"}
      loading={isPending}
      onClick={() =>
        manage({
          topic: topicName,
          service,
          action: subscribed ? "unsubscribe" : "subscribe",
        })
      }
    >
      {subscribed ? "Unsubscribe" : "Subscribe"}
    </Button>
  );
};

const Topic: FC<{
  topicName: string;
  topic: PxGridTopic;
  subs?: SubscriptionsOfService;
  service: string;
}> = ({ topicName, topic, subs, service }) => {
  return (
    <div className={styles.topic}>
      <Stack gap={0}>
        <div className={styles.topic_name}>
          <Text fw="bold">{topicName}</Text>
          {isSubscribed(subs, topic) ? (
            <Badge
              size="sm"
              color="blue"
              leftSection={<IconCheck size={14} />}
              variant="light"
            >
              Subscribed
            </Badge>
          ) : null}
        </div>
        <Text size="xs">{topic.destination}</Text>
        <Text size="xs">{topic.description}</Text>
      </Stack>
      <SubscribeButton
        topicName={topicName}
        topic={topic}
        subscribed={isSubscribed(subs, topic)}
        service={service}
      />
    </div>
  );
};

export const TopicsOfService: FC<{
  service: string;
  topics: PxGridServiceTopics;
  services?: PxGridServices["services"];
  subs?: PxGridSubscription[];
  noHeading?: boolean;
}> = ({ service, topics, services, subs, noHeading }) => {
  const svcDetails = useMemo(() => {
    if (services) {
      return services.find((svc) => svc.friendly_name === service);
    }
    return undefined;
  }, [service, services]);

  const svcSubs = useMemo(() => {
    if (subs) {
      return subs
        .filter((sub) => sub.service === service)
        .reduce((acc, sub) => {
          acc[sub.topic ?? "unknownTopic"] = sub;
          return acc;
        }, {} as SubscriptionsOfService);
    }
    return undefined;
  }, [service, subs]);

  return (
    <Stack gap="sm">
      {noHeading ? null : (
        <div className={styles.service_heading}>
          <Title order={6}>{svcDetails?.display_name || service}</Title>
          {svcDetails?.display_name ? <Text>{service}</Text> : null}
        </div>
      )}
      {Object.entries(topics).map(([topicName, topic]) => (
        <Topic
          key={topicName}
          topicName={topicName}
          topic={topic}
          subs={svcSubs}
          service={service}
        />
      ))}
    </Stack>
  );
};
