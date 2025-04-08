import { FC } from "react";
import { Button, Group, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSend } from "@tabler/icons-react";

import { PxGridService } from "@/hooks/pxgrid/schemas";

import { hasRest } from "./has";
import { LookupButton } from "./LookupButton";
import { RESTModalBody } from "./RESTModal";

export type ActionsProps = {
  serviceName: string;
  service: PxGridService;
};

export const ServiceDetails: FC<ActionsProps> = ({ serviceName, service }) => {
  const [opened, { open, close }] = useDisclosure();

  return (
    <>
      <Group gap="xs">
        <LookupButton />
        <Button
          leftSection={<IconSend size={16} />}
          disabled={!hasRest(service)}
          onClick={open}
        >
          Send REST request
        </Button>
      </Group>
      <Modal
        opened={opened}
        onClose={close}
        title="Send REST request"
        size="xl"
      >
        <RESTModalBody serviceName={serviceName} service={service} />
        <Group justify="end" mt="sm">
          <Button variant="default" onClick={close}>
            Close
          </Button>
        </Group>
      </Modal>
    </>
  );
};
