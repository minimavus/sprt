import { FC, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Popover,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure, useTimeout } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import {
  IconSwitchHorizontal,
  IconUserOff,
  IconUsers,
} from "@tabler/icons-react";

import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { useLogOwners } from "@/hooks/logs";
import { QueryUser, useQueryUser } from "@/hooks/useQueryUser";

import { NavbarLink } from "./NavbarLink";
import { NavbarLinkProps } from "./types";

type SwitchUserProps = Omit<NavbarLinkProps, "icon" | "label">;

const SwitchUserModal: FC<{
  onClose: () => void;
  user: QueryUser;
  setUser: (user: QueryUser) => void;
}> = ({ onClose, user, setUser }) => {
  const { data, error, status, refetch } = useLogOwners();

  const users = useMemo(() => {
    if (data) {
      return data
        .map((user) => user.owner)
        .filter((user) => !user.startsWith("_") && !user.endsWith("__api"))
        .sort();
    }
    return [];
  }, [data]);

  const [value, setValue] = useState<string | null>(user || null);

  return (
    <Stack gap="xs">
      {status === "pending" ? (
        <DefaultLoaderFallback />
      ) : status === "error" ? (
        <DisplayError error={error} onReset={refetch} />
      ) : (
        <Select
          label="User"
          placeholder="Select user"
          data={users}
          value={value}
          searchable
          onChange={(val) => {
            setValue(val);
          }}
        />
      )}
      <ModalFooter>
        <Button type="button" onClick={onClose} variant="default">
          Close
        </Button>
        <Button
          onClick={() => {
            setUser(value || undefined);
            onClose();
          }}
        >
          OK
        </Button>
      </ModalFooter>
    </Stack>
  );
};

const SwitchUserDropdown: FC<{
  onSelect: () => void;
}> = ({ onSelect }) => {
  const [user, setUser] = useQueryUser();
  const { openModal, closeModal } = useModals();

  const handleSelectUser = () => {
    onSelect();
    const id = openModal({
      title: "Select user",
      children: (
        <SwitchUserModal
          onClose={() => closeModal(id)}
          user={user}
          setUser={setUser}
        />
      ),
    });
  };

  return (
    <Stack gap="xs" px="md" py="xs">
      <Text c="dimmed" size="xs">
        Switch user
      </Text>
      <Box>
        <Text span size="xs">
          Currently navigating as:
        </Text>
        <Text fw="bold" span size="xs" ml={6}>
          {user || "myself"}
        </Text>
      </Box>
      <Divider />
      <Box>
        <ButtonGroup>
          <Button
            variant="subtle"
            size="compact-xs"
            leftSection={<IconUsers size={16} stroke={1.5} />}
            onClick={handleSelectUser}
          >
            Select
          </Button>
          {user ? (
            <Button
              onClick={() => setUser(undefined)}
              variant="subtle"
              size="compact-xs"
              leftSection={<IconUserOff size={16} stroke={1.5} />}
            >
              Clear user
            </Button>
          ) : null}
        </ButtonGroup>
      </Box>
    </Stack>
  );
};

export const SwitchUser: FC<SwitchUserProps> = (props) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { start, clear } = useTimeout(() => {
    close();
  }, 1_000);

  const onDismiss = () => {
    close();
    clear();
  };

  return (
    <Popover
      position="right"
      shadow="md"
      opened={opened}
      clickOutsideEvents={["mouseup", "touchend"]}
      onDismiss={onDismiss}
    >
      <Popover.Target>
        <NavbarLink
          icon={IconSwitchHorizontal}
          buttonProps={{
            onMouseEnter: () => {
              open();
              clear();
            },
            onMouseLeave: start,
          }}
          {...props}
        />
      </Popover.Target>
      <Popover.Dropdown onMouseEnter={clear} onMouseLeave={start} p={0}>
        <SwitchUserDropdown onSelect={onDismiss} />
      </Popover.Dropdown>
    </Popover>
  );
};
