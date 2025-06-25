import { FC } from "react";
import { Stack, Title } from "@mantine/core";
import { useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { SkeletonLines } from "@/components/Skeleton";
import { usePxGridConnectionServices } from "@/hooks/pxgrid/services";
import { usePxGridConnectionTopics } from "@/hooks/pxgrid/topics";
import { useQueryUser } from "@/hooks/useQueryUser";

import { TopicsOfService } from "../Topics/TopicsOfService";
import { ActionsProps } from "./ServiceActions";

export const TopicsBody: FC<ActionsProps> = ({ serviceName }) => {
  const { id } = useParams<{ id: string }>();
  const [user] = useQueryUser();
  const {
    data: topicsData,
    status: topicsDataStatus,
    error: topicsDataError,
    refetch: topicsRefetch,
  } = usePxGridConnectionTopics(id!, user);
  const {
    data: services,
    status: servicesStatus,
    error: statusError,
    refetch: servicesRefetch,
  } = usePxGridConnectionServices(id!, user);

  if (topicsDataStatus === "pending" || servicesStatus === "pending") {
    return (
      <Stack gap="sm" flex={1}>
        <SkeletonLines height="lg" x={1} mb={0} width={"40%"} />
        <SkeletonLines height="md" x={4} mb={0} />
      </Stack>
    );
  }

  if (topicsDataStatus === "error" || servicesStatus === "error") {
    return (
      <DisplayError
        error={topicsDataError || statusError}
        onReset={() => (topicsDataError ? topicsRefetch() : servicesRefetch())}
      />
    );
  }

  return (
    <>
      <Title order={5}>Topics</Title>
      <TopicsOfService
        topics={topicsData?.topics[serviceName] ?? {}}
        services={services}
        subs={topicsData?.subscriptions}
        service={serviceName}
        noHeading
      />
    </>
  );
};
