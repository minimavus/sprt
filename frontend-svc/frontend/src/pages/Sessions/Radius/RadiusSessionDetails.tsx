import { Button, Group, Modal, rem, Stack, Tabs, Text } from "@mantine/core";
import type { DefaultError } from "@tanstack/react-query";
import { type FC, Suspense, useState } from "react";
import { Await, type LoaderFunction, useLoaderData } from "react-router-dom";

import { Warning } from "@/components/Alerts";
import { AwaitError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { queryClient } from "@/hooks/queryClient";
import { getSessionKeyAndEnsureDefaults } from "@/hooks/sessions";
import type { RadiusSessionDetails } from "@/hooks/sessions/schemas";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";

import { tabNameFromFlowType } from "../tabNameFromFlowType";
import { Flow } from "./sessionDetails/Flow";

type LoaderData = {
  session: RadiusSessionDetails;
};

const Details: FC<{ session: RadiusSessionDetails }> = ({ session }) => {
  const [selectedFlowId, setSelectedFlowId] = useState<number>(0);

  if (!session) {
    return (
      <Warning title="No data">No data available for this session</Warning>
    );
  }

  if (!Array.isArray(session.flows) || session.flows.length === 0) {
    return (
      <Warning title="No data">No flows available for this session</Warning>
    );
  }

  return (
    <Group gap="xs" flex="grow" align="start">
      <Tabs
        value={selectedFlowId.toString()}
        onChange={(v) => setSelectedFlowId(v ? parseInt(v, 10) : 0)}
        orientation="vertical"
        pos="sticky"
        top={69}
      >
        <Tabs.List>
          {session.flows.map((flow, idx) => {
            const name = tabNameFromFlowType[flow.type];
            return (
              <Tabs.Tab key={flow.type} value={idx.toString()}>
                {name}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>
      <Flow flow={session.flows[selectedFlowId]} />
    </Group>
  );
};

const LoadedSubHeading: FC = () => {
  const d = useLoaderData() as LoaderData;

  return (
    <Suspense fallback={null}>
      <Await resolve={d.session} errorElement={null}>
        {(session) => (
          <Text size="xs" mt={rem(4)}>
            Endpoint: {session.mac}
          </Text>
        )}
      </Await>
    </Suspense>
  );
};

const RadiusSessionDetailsModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const data = useLoaderData() as LoaderData;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="100%"
      yOffset="2dvh"
      xOffset="2dvw"
      title={
        <>
          Session
          <LoadedSubHeading />
        </>
      }
    >
      <Stack gap="sm">
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await
            resolve={data.session}
            errorElement={<AwaitError before={null} />}
          >
            {(session) => <Details session={session} />}
          </Await>
        </Suspense>
        <ModalFooter stickyBottom>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Stack>
    </Modal>
  );
};

export const radiusSessionDetailsLoader: LoaderFunction = async ({
  params,
  request,
}) => {
  if (!params.server || !params.bulk || !params.session) {
    return { session: null };
  }

  const user = new URL(request.url).searchParams.get("user");
  const queryKey = getSessionKeyAndEnsureDefaults(
    user,
    params.server,
    params.bulk,
    params.session,
    "radius",
  );
  return {
    session: queryClient.ensureQueryData<
      unknown,
      DefaultError,
      RadiusSessionDetails
    >({
      queryKey,
    }),
  };
};

export { RadiusSessionDetailsModal as RadiusSessionDetails };
