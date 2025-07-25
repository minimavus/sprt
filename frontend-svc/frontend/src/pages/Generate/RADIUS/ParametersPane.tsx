import { use$ } from "@legendapp/state/react";
import { Code, SimpleGrid, Stack, Tabs, Title } from "@mantine/core";
import type { FC } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useParams } from "react-router-dom";
import { Info } from "@/components/Alerts";
import { DisplayError } from "@/components/Error";
import { useProtoSpecificParameters } from "@/hooks/generate/useProtoSpecificParams";
import { useQueryUser } from "@/hooks/useQueryUser";
import { VisibilityContext } from "./common/visibilityContext";
import { APIParameters } from "./Panels/APIParameters";
import { CoAParameters } from "./Panels/CoAParameters";
import { GenerationParameters } from "./Panels/GenerationParameters";
import { GuestFlowParameters } from "./Panels/GuestFlowParameters";
import { IPAddressesParameters } from "./Panels/IPAddressesParameters";
import { MACAddressesParameters } from "./Panels/MACAddressesParameters";
import { NADParameters } from "./Panels/NADParameters";
import { DynamicParametersBlock } from "./Panels/ParametersBlock";
import { RadiusAttributes } from "./Panels/RadiusAttributes";
import { RadiusDictionaries } from "./Panels/RadiusDictionaries";
import { ScheduleParameters } from "./Panels/ScheduleParameters";
import { ServerParameters } from "./Panels/ServerParameters";
import { radiusParamsStore$, type Tab } from "./store";
import styles from "./styles.module.scss";

type CommonParamsProps = {
  visible: boolean;
};

const GeneralParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <SimpleGrid
      cols={{ base: 1, "750px": 2 }}
      className={visible ? undefined : styles.hidden}
      type="container"
      spacing="sm"
    >
      <div>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary, error }) => (
            <DisplayError onReset={() => resetErrorBoundary()} error={error} />
          )}
        >
          <NADParameters />
          <ServerParameters />
        </ErrorBoundary>
      </div>
      <div>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary, error }) => (
            <DisplayError onReset={() => resetErrorBoundary()} error={error} />
          )}
        >
          <GenerationParameters />
        </ErrorBoundary>
      </div>
    </SimpleGrid>
  );
};

const MACAddressesParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>MAC Addresses</Title>
      <Info>
        {
          "How MAC address should be generated for each session. Variable name: "
        }
        <Code>$MAC$</Code>
      </Info>
      <MACAddressesParameters />
    </Stack>
  );
};

const IPAddressesParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>IP Addresses</Title>
      <Info>
        {"How IP address should be generated for each session. Variable name: "}
        <Code>$IP$</Code>
      </Info>
      <IPAddressesParameters />
    </Stack>
  );
};

const RadiusParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap={0} className={visible ? undefined : styles.hidden}>
      <RadiusDictionaries />
      <RadiusAttributes />
    </Stack>
  );
};

const SchedulerParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>Scheduler</Title>
      <ScheduleParameters />
    </Stack>
  );
};

const APIParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>API</Title>
      <APIParameters visible={visible} />
    </Stack>
  );
};

const CoAParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>Change of Authorization (CoA)</Title>
      <CoAParameters />
    </Stack>
  );
};

const GuestFlowParams: FC<CommonParamsProps> = ({ visible }) => {
  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      <Title order={3}>Guest Flow</Title>
      <GuestFlowParameters />
    </Stack>
  );
};

const DynamicParams: FC<CommonParamsProps> = ({ visible }) => {
  const visibleTabs = use$(radiusParamsStore$.uiState.visibleTabs);
  const { proto } = useParams<{ proto: string }>();
  const [u] = useQueryUser();
  const { data } = useProtoSpecificParameters(proto!, u);

  const params = data?.parameters.find((p) =>
    visibleTabs.includes(`${data.proto_name}-${p.title}`),
  );

  return (
    <Stack gap="sm" className={visible ? undefined : styles.hidden}>
      {params ? (
        <>
          <Title order={3}>{params.title}</Title>
          <DynamicParametersBlock block={params} prefix={params.prop_name} />
        </>
      ) : (
        <DisplayError
          error={{ message: `No parameters found for proto ${proto}` }}
        />
      )}
    </Stack>
  );
};

const tabsMap = new Map<Tab, FC<CommonParamsProps>>([
  ["general", GeneralParams],
  ["mac_addresses", MACAddressesParams],
  ["ip_addresses", IPAddressesParams],
  ["radius", RadiusParams],
  ["scheduler", SchedulerParams],
  ["api", APIParams],
  ["coa", CoAParams],
  ["guest", GuestFlowParams],
]);

export const ParametersPane: FC = () => {
  const tab = use$(radiusParamsStore$.uiState.tab);
  const { proto } = useParams<{ proto: string }>();

  const visibleTabs = use$(radiusParamsStore$.uiState.visibleTabs);

  return visibleTabs.map((t) => {
    const El = tabsMap.get(t) ?? DynamicParams;
    return (
      <Tabs.Panel
        key={`${t}-${proto}`}
        value={t}
        flex={1}
        p="sm"
        keepMounted
        className={styles.tab_panel}
      >
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary, error }) => (
            <DisplayError onReset={() => resetErrorBoundary()} error={error} />
          )}
        >
          <VisibilityContext value={{ visible: t === tab }}>
            <El key={`${t}-${proto}`} visible={t === tab} />
          </VisibilityContext>
        </ErrorBoundary>
      </Tabs.Panel>
    );
  });
};
