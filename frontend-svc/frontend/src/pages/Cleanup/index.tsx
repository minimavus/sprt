import {
  Divider,
  Loader,
  Tabs,
  type TabsTabProps,
  Tooltip,
} from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";
import { Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";

import { PageLayout } from "@/components/Layout/PageLayout";
import { StatusIcon } from "@/components/StatusIcon";
import {
  type CleanupSection,
  type StatusLevel,
  useCleanupSectionStatus,
} from "@/hooks/cleanups";

const statusLevelToIcon = (level: StatusLevel | undefined) => {
  switch (level) {
    case "success":
      return <StatusIcon status="positive" size={18} />;
    case "warning":
      return <StatusIcon status="warning" size={18} />;
    case "danger":
      return <StatusIcon status="negative" size={18} />;
    case "info":
      return <StatusIcon status="info" size={18} />;
    default:
      return <Loader size={18} />;
  }
};

const SectionStatusIcon: FC<{ section: CleanupSection }> = ({ section }) => {
  const { data, error, isFetching } = useCleanupSectionStatus(section);

  let component: ReactNode;
  if (isFetching) {
    component = <Loader size={18} type="dots" color="dimmed" />;
  } else if (error) {
    component = (
      <Tooltip label={error.message || "Error"}>
        <StatusIcon status="negative" size={18} />
      </Tooltip>
    );
  } else {
    component = statusLevelToIcon(data?.level);
    if (data?.type === "text" && data.value) {
      component = <Tooltip label={data.value}>{component}</Tooltip>;
    }
  }

  return component;
};

const tabDisplayProps: Pick<TabsTabProps, "flex" | "style" | "display"> = {
  display: "flex",
  style: {
    alignItems: "center",
    justifyContent: "space-between",
  },
};

const Cleanup: FC = () => {
  const match = useMatch("/cleanup/:section");
  const section = match?.params.section ?? "sessions";
  const nav = useNavigate();
  const l = useLocation();

  return (
    <PageLayout title="Clean Ups" fullHeight={false}>
      <Tabs
        defaultValue={section}
        value={section}
        orientation="vertical"
        onChange={(value) => {
          const where = value === "sessions" ? "" : `/${value}`;
          nav(`/cleanup${where}${l.search}`, { relative: "path" });
        }}
        flex={1}
      >
        <Tabs.List pt="md" pb="md">
          <Tabs.Tab
            value="sessions"
            rightSection={<SectionStatusIcon section="sessions" />}
            {...tabDisplayProps}
          >
            Outdated sessions
          </Tabs.Tab>
          <Tabs.Tab
            value="flows"
            rightSection={<SectionStatusIcon section="flows" />}
            {...tabDisplayProps}
          >
            Orphaned flows
          </Tabs.Tab>
          <Tabs.Tab
            value="clis"
            rightSection={<SectionStatusIcon section="clis" />}
            {...tabDisplayProps}
          >
            Orphaned CLIs
          </Tabs.Tab>
          <Tabs.Tab
            value="processes"
            rightSection={<SectionStatusIcon section="processes" />}
            {...tabDisplayProps}
          >
            Running processes
          </Tabs.Tab>
          <Tabs.Tab
            value="scheduled"
            rightSection={<SectionStatusIcon section="scheduled" />}
            {...tabDisplayProps}
          >
            Scheduled
          </Tabs.Tab>
          <Divider my="xs" />
          <Tabs.Tab value="settings" leftSection={<IconSettings size={14} />}>
            Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={section} p="md" flex={1}>
          <Outlet />
        </Tabs.Panel>
      </Tabs>
    </PageLayout>
  );
};

export { Cleanup };
