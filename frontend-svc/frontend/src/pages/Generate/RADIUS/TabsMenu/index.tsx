import { Memo } from "@legendapp/state/react";
import {
  Button,
  getThemeColor,
  Menu,
  Tabs,
  type TabsTabProps,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { type FC, useEffect, useMemo } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { useAsyncValue, useNavigate, useParams } from "react-router-dom";

import { fadeInClampOut } from "@/animations";
import { StatusIcon } from "@/components/StatusIcon";
import type {
  ParametersBlock,
  ProtoDefinition,
} from "@/hooks/generate/schemas";
import { useServersSettings } from "@/hooks/settings/servers";
import { useQueryUser } from "@/hooks/useQueryUser";

import { protoNames, radiusProtos } from "../../../../utils/protos";
import type { RadiusForm } from "../form";
import { radiusParamsStore$ } from "../store";

const mainTabProps: Partial<TabsTabProps> = {
  style: { justifyContent: "space-between", alignItems: "center" },
};

const MotionedTab = motion.create(Tabs.Tab);

const useLoadedServer = () => {
  const [u] = useQueryUser();
  const { data } = useServersSettings(u);
  const loadedId = useWatch<RadiusForm, "general.server.loadedId">({
    name: "general.server.loadedId",
  });

  return useMemo(
    () =>
      Boolean(loadedId) && data
        ? data.find((s) => s.id === loadedId && s.coa)
        : null,
    [data, loadedId],
  );
};

const getProtoSpecificTabKey = (
  proto: ProtoDefinition,
  param: ParametersBlock,
) => `${proto.proto_name}-${param.title}`;

const ProtoSpecific: FC = () => {
  const [, proto] = useAsyncValue() as [unknown, ProtoDefinition | null];
  const state = useFormState<RadiusForm>();

  useEffect(() => {
    radiusParamsStore$.uiState.removeDynamicTabs();
    if (proto) {
      radiusParamsStore$.uiState.addDynamicTabs(
        proto.parameters.map((p) => getProtoSpecificTabKey(proto, p)),
      );
    }
  }, [proto]);

  return (
    <>
      {proto?.parameters.map((param) => (
        <Tabs.Tab
          value={getProtoSpecificTabKey(proto, param)}
          key={param.title}
          {...mainTabProps}
          rightSection={
            (state.errors as any)?.[param.prop_name] ? (
              <StatusIcon status="warning" size={14} />
            ) : undefined
          }
        >
          {param.title}
        </Tabs.Tab>
      ))}
    </>
  );
};

const CoAMenuItem: FC = () => {
  const server = useLoadedServer();
  const state = useFormState<RadiusForm>();

  useEffect(() => {
    if (server?.coa) {
      radiusParamsStore$.uiState.showTabs(["coa"]);
    } else {
      radiusParamsStore$.uiState.hideTabs(["coa"]);
    }
  }, [server?.coa]);

  return (
    <AnimatePresence>
      {server?.coa ? (
        <MotionedTab
          {...fadeInClampOut}
          value="coa"
          key="coa"
          {...(mainTabProps as any)}
          rightSection={
            (state.errors as any)?.coa ? (
              <StatusIcon status="warning" size={14} />
            ) : undefined
          }
        >
          CoA Options
        </MotionedTab>
      ) : null}
    </AnimatePresence>
  );
};

const GuestMenuItem: FC = () => {
  const server = useLoadedServer();

  useEffect(() => {
    if (server?.coa) {
      radiusParamsStore$.uiState.showTabs(["guest"]);
    } else {
      radiusParamsStore$.uiState.hideTabs(["guest"]);
    }
  }, [server?.coa]);

  return (
    <AnimatePresence>
      {server?.coa ? (
        <MotionedTab {...fadeInClampOut} value="guest">
          Guest Flow
        </MotionedTab>
      ) : null}
    </AnimatePresence>
  );
};

const ProtoSelect: FC = () => {
  const { proto } = useParams<{ proto: string }>();
  const nav = useNavigate();
  const [isMenuOpen, { close, open }] = useDisclosure();
  const theme = useMantineTheme();

  return (
    <Memo>
      <Menu key={proto} onOpen={() => open()} onClose={() => close()}>
        <Menu.Target>
          <Button
            ml="xl"
            size="compact-xs"
            variant="subtle"
            rightSection={
              <IconChevronDown
                size={14}
                style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
              />
            }
          >
            {protoNames.get(proto!)}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {radiusProtos.map((p) => (
            <Menu.Item
              key={p}
              onClick={() => {
                if (proto === p) {
                  return;
                }

                nav(`/generate/${p}`);
              }}
              style={{
                justifyContent: "space-between",
              }}
              rightSection={
                proto === p ? (
                  <IconCheck size={14} color={getThemeColor("green", theme)} />
                ) : null
              }
            >
              <span>{protoNames.get(p)}</span>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Memo>
  );
};

export const ParametersMenu: FC = () => {
  const state = useFormState<RadiusForm>();

  return (
    <>
      <Tabs.Tab
        value="none"
        rightSection={<ProtoSelect />}
        onClick={() => void 0}
        style={{ cursor: "unset", justifyContent: "space-between" }}
        pr="xs"
        component="div"
      >
        Protocol
      </Tabs.Tab>
      <Tabs.Tab
        value="general"
        {...mainTabProps}
        rightSection={
          state.errors?.general ? (
            <StatusIcon status="warning" size={14} />
          ) : undefined
        }
      >
        General
      </Tabs.Tab>
      <Tabs.Tab
        value="mac_addresses"
        {...mainTabProps}
        rightSection={
          state.errors?.macAddresses ? (
            <StatusIcon status="warning" size={14} />
          ) : undefined
        }
      >
        MAC Addresses
      </Tabs.Tab>
      <Tabs.Tab
        value="ip_addresses"
        {...mainTabProps}
        rightSection={
          state.errors?.ipAddresses ? (
            <StatusIcon status="warning" size={14} />
          ) : undefined
        }
      >
        IP Addresses
      </Tabs.Tab>
      <ProtoSpecific />
      <CoAMenuItem />
      <GuestMenuItem />
      <Tabs.Tab
        value="radius"
        {...mainTabProps}
        rightSection={
          state.errors?.radius ? (
            <StatusIcon status="warning" size={14} />
          ) : undefined
        }
      >
        RADIUS
      </Tabs.Tab>
      <Tabs.Tab
        value="scheduler"
        {...mainTabProps}
        rightSection={
          state.errors?.scheduler ? (
            <StatusIcon status="warning" size={14} />
          ) : undefined
        }
      >
        Scheduler
      </Tabs.Tab>
      <Tabs.Tab value="api" {...mainTabProps}>
        API
      </Tabs.Tab>
    </>
  );
};
