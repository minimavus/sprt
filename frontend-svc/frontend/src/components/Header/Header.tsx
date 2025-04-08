import { FC, ReactNode } from "react";
import {
  ActionIcon,
  Button,
  Center,
  Divider,
  Group,
  HoverCard,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconBrush,
  IconChevronDown,
  IconMoonStars,
  IconSun,
  IconUser,
} from "@tabler/icons-react";

import { useAllUserAttributes, useIsDarkTheme, useUser } from "@/hooks/useUser";

import classes from "./Header.module.scss";
import { Logo } from "./Logo";
import { OurBurger } from "./OurBurger";

const UserMenu: FC = () => {
  const { data: user } = useUser();
  const isDark = useIsDarkTheme();
  const { data: attributes, updateAsync } = useAllUserAttributes();

  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const toggleTheme = () => {
    const oldTheme = colorScheme;
    const newTheme = attributes?.ui?.theme === "dark" ? "light" : "dark";
    setColorScheme(newTheme);
    updateAsync({
      attribute: "ui.theme",
      value: newTheme,
    }).catch(() => {
      setColorScheme(oldTheme);
    });
  };

  return (
    <HoverCard
      width={400}
      position="bottom"
      radius="md"
      shadow="md"
      withinPortal
    >
      <HoverCard.Target>
        <Button
          rightSection={<IconChevronDown size={16} />}
          leftSection={<IconUser size={20} />}
          variant="default"
          radius="md"
        >
          {user?.Name || user?.FirstName}
        </Button>
      </HoverCard.Target>

      <HoverCard.Dropdown style={{ overflow: "hidden" }}>
        <Group justify="space-between" align="center" gap="sm" mb="sm">
          <Center>
            <IconUser size={20} />
          </Center>
          <Stack style={{ alignSelf: "stretch", flexGrow: 1 }} gap="0">
            <Text size="xs" tt="uppercase">
              Logged in as
            </Text>
            <Text size="sm" fw="bold">
              {user?.Name || user?.FirstName}
            </Text>
            <Text size="sm">{user?.Email}</Text>
          </Stack>
          <Center>
            <Button
              variant="outline"
              onClick={() => {
                window.location.assign("/logout");
              }}
              size="sm"
            >
              Logout
            </Button>
          </Center>
        </Group>

        <Divider />

        <Group gap="sm" justify="space-between" mt="sm">
          <Center>
            <IconBrush size={20} />
          </Center>
          <Group style={{ alignSelf: "stretch", flexGrow: 1 }} gap="0">
            <Text size="sm">Theme</Text>
          </Group>
          <Center>
            <ActionIcon variant="subtle" onClick={toggleTheme} size="md">
              {isDark ? <IconMoonStars size={20} /> : <IconSun size={20} />}
            </ActionIcon>
          </Center>
        </Group>
      </HoverCard.Dropdown>
    </HoverCard>
  );
};

function SourceCodeButton() {
  return (
    <Tooltip label="Source code" openDelay={500}>
      <ActionIcon
        variant="default"
        radius="md"
        size={36}
        component="a"
        href="https://github.com/cisco-open/sprt"
        target="_blank"
      >
        <IconBrandGithub size={20} />
      </ActionIcon>
    </Tooltip>
  );
}

function Header(): ReactNode {
  return (
    <header className={classes.header}>
      <Group justify="space-between" h="100%">
        <Group>
          <OurBurger />
          <Logo />
          <Title size="lg">SPRT</Title>
        </Group>
        <Group visibleFrom="sm" gap="sm">
          <SourceCodeButton />
          <UserMenu />
        </Group>
      </Group>
    </header>
  );
}

export default Header;
