import { useMemo, useState, type FC, type ReactElement } from "react";
import { LineChart } from "@mantine/charts";
import { Paper, Stack, Tabs, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { path } from "rambda";
import { NavigateFunction } from "react-router-dom";
import { ResponsiveContainer, XAxisProps } from "recharts";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";

import type { Job, JobStats } from "@/hooks/jobs/schemas";
import { getSearchSessionSummaryAndEnsureDefaults } from "@/hooks/sessions";
import type { CompactSessionSummary } from "@/hooks/sessions/schemas";
import type { QueryUser } from "@/hooks/useQueryUser";
import type { Protos } from "@/hooks/zodProto";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { isRadiusProto } from "@/utils/protos";
import { toast } from "@/utils/toasts";

const isDataWithPayload = (data: any): data is { payload: any } =>
  data && typeof data == "object" && data.payload;

type JobAttributes = NonNullable<Job["attributes"]>;

type RequiredAttributes = DeepNonNullable<
  RequiredBy<JobAttributes, "server" | "protocol">
>;

const isJobWithAttributes = (
  job: Job,
): job is Job & { attributes: RequiredAttributes } =>
  Boolean(job.attributes?.server) && Boolean(job.attributes?.protocol);

const tabs = [
  {
    name: "delays",
    label: "Delays",
    y: "Delay (ms)",
    x: "Delay",
    avg: "Average delay",
    unit: "ms",
  },
  {
    name: "lengths",
    label: "Durations",
    y: "Duration (ms)",
    x: "Duration",
    avg: "Average duration",
    unit: "ms",
  },
  {
    name: "retransmits",
    label: "Retransmits",
    y: "Retransmits",
    x: "Retransmits",
    avg: "",
    unit: null,
  },
] as {
  name: string;
  label: string;
  y: string;
  x: string;
  avg: string;
  unit: string | null;
}[];

const CustomTooltip: FC<{
  label?: any;
  payload?: Payload<any, any>[] | undefined;
  unit: string | null;
  mainLabel?: string;
  avgLabel?: string;
}> = ({ label, payload, unit, mainLabel, avgLabel }) => {
  if (!payload || !payload.length) return null;

  const dt = new Date(parseFloat(label) * 1000);

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        {format(dt, "HH:mm:ss.SSS")}
      </Text>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {payload.map((p) => (
          <li key={p.dataKey as string}>
            <Text
              c={p.color}
              span
            >{`${p.name === "avg" ? avgLabel : mainLabel}: `}</Text>
            <Text span>{`${p.value.toFixed(3)} ${unit ?? ""}`}</Text>
          </li>
        ))}
      </ul>
    </Paper>
  );
};

const CustomizedAxisTick: (props: any) => ReactElement<SVGElement> = ({
  x,
  y,
  payload,
}) => {
  const dt = new Date(parseFloat(payload.value) * 1000);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {format(dt, "HH:mm:ss.SSS")}
      </text>
    </g>
  );
};

export const JobCharts: FC<{
  data: JobStats;
  job: Job;
  user: QueryUser;
  nav: NavigateFunction;
  close: () => void;
  search: string | undefined;
}> = ({ data: stats, user, nav, job, close, search }) => {
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);

  const xProps = useMemo(() => {
    const d = path(
      `stats.lengths.new_style`,
      stats,
    ) as JobStats["stats"]["lengths"]["new_style"];
    if (!d?.length || !d[0].name) return { hide: true } as XAxisProps;
    return {
      tick: CustomizedAxisTick,
      height: 80,
    } as XAxisProps;
  }, [stats]);

  const qc = useQueryClient();

  return (
    <Stack gap="sm">
      <Tabs
        defaultValue={tabs[0].name}
        onChange={(tn) => setTab(tabs.find((t) => t.name === tn)!)}
      >
        <Tabs.List>
          {tabs.map((t) => (
            <Tabs.Tab key={t.name} value={t.name}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={path(`stats.${tab.name}.new_style`, stats) ?? []}
          m={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
          dataKey="name"
          xAxisProps={xProps}
          gridAxis="x"
          withLegend
          series={[
            { name: "value", label: tab.label, color: "teal.6" },
            ...(path(`stats.${tab.name}.new_style.0.avg`, stats) !== undefined
              ? [{ name: "avg", label: tab.avg, color: "yellow.6" }]
              : []),
          ]}
          curveType="monotone"
          tooltipProps={{
            content: (pr) => (
              <CustomTooltip
                unit={tab.unit}
                {...pr}
                mainLabel={tab.x}
                avgLabel={tab.avg}
              />
            ),
          }}
          withTooltip
          withDots
          unit={tab.unit ?? ""}
          activeDotProps={{
            r: 5,
            onClick: async (_, event) => {
              if (!isDataWithPayload(event) || !isJobWithAttributes(job)) {
                toast.error({
                  message:
                    "Could not open session details: job missing attributes",
                });
                return;
              }

              const loadingToast = toast.loading({
                message: "Loading session details...",
                autoClose: false,
              });

              const p: Protos = isRadiusProto(job.attributes.protocol)
                ? "radius"
                : "tacacs";
              let bulk: string;

              try {
                const queryKey = getSearchSessionSummaryAndEnsureDefaults(
                  user,
                  event.payload.id,
                  p,
                );
                const d = await qc.ensureQueryData<
                  unknown,
                  Error,
                  CompactSessionSummary
                >({ queryKey });
                bulk = d.bulk || "none";
                toast.info({
                  id: loadingToast,
                  message: "Session details loaded, redirecting...",
                });
              } catch (e) {
                if (isAxiosError(e) && e.response?.status === 404) {
                  toast.error({
                    id: loadingToast,
                    message: "Session not found",
                  });
                  return;
                }
                toast.error({
                  id: loadingToast,
                  message: `Could not open session details: ${getErrorMessage(e)}`,
                });
                log.error(e, "Could not open session details");
                return;
              }

              close();
              nav(
                `/sessions/${p}/${job.attributes.server}/${bulk}/${event.payload.id}${search ?? ""}`,
              );
            },
            style: { cursor: "pointer" },
          }}
        />
      </ResponsiveContainer>
    </Stack>
  );
};
