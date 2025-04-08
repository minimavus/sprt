import { FC, Fragment } from "react";
import { Divider, Stack, Text } from "@mantine/core";
import { isEmpty, isNil } from "rambda";
import { useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { SkeletonLines } from "@/components/Skeleton";
import { usePxGridConnectionServices } from "@/hooks/pxgrid/services";
import { usePxGridConnectionTopics } from "@/hooks/pxgrid/topics";
import { useQueryUser } from "@/hooks/useQueryUser";

import { TopicsOfService } from "./TopicsOfService";

export const Topics: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user] = useQueryUser();
  const { data, status, error, refetch } = usePxGridConnectionTopics(id!, user);
  const { data: services } = usePxGridConnectionServices(id!, user);

  if (status === "pending") {
    return (
      <Stack gap="sm" flex={1}>
        <SkeletonLines height="lg" x={1} mb={0} width={"40%"} />
        <SkeletonLines height="md" x={4} mb={0} />
      </Stack>
    );
  }

  if (status === "error") {
    return <DisplayError error={error} onReset={() => refetch()} />;
  }

  if (isNil(data) || isEmpty(data)) {
    return <Text>No topics available</Text>;
  }

  return Object.entries(data.topics)
    .filter(([, topics]) => !isEmpty(topics))
    .map(([service, topics], idx) => (
      <Fragment key={service}>
        {idx > 0 ? <Divider /> : null}
        <TopicsOfService
          topics={topics}
          services={services}
          service={service}
          subs={data.subscriptions}
        />
      </Fragment>
    ));
};
