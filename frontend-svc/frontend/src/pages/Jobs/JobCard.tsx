import type { FC } from "react";
import { use$ } from "@legendapp/state/react";
import {
  Button,
  Card,
  Divider,
  getThemeColor,
  Group,
  Progress,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconCircleCheckFilled,
  IconPlayerStop,
  IconRepeat,
  IconTimeline,
  IconTrash,
} from "@tabler/icons-react";
import cx from "classnames";
import { NavigateFunction, useLocation, useNavigate } from "react-router-dom";

import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { styles } from "@/components/CardGrid";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { FormatTime } from "@/components/Time";
import {
  Job,
  useJobCancel,
  useJobDelete,
  useJobRepeat,
  useJobStats,
} from "@/hooks/jobs";
import { QueryUser, useQueryUser } from "@/hooks/useQueryUser";

import { JobCharts } from "./JobCharts";
import { JobDetailsCollapse } from "./JobDetailsCollapse";
import { state$ } from "./store";
import { getJobLabel, getJobStatus } from "./utils";

const ChartsModal: FC<{
  job: Job;
  close: () => void;
  user: QueryUser;
  nav: NavigateFunction;
  search?: string;
}> = ({ job, user, close, nav, search }) => {
  const { data, error, status } = useJobStats(job.id!, user);

  return (
    <>
      {error ? <DisplayError error={error} /> : null}
      {status === "pending" ? <DefaultLoaderFallback /> : null}
      {status === "success" && data ? (
        <JobCharts
          data={data}
          job={job}
          nav={nav}
          user={user}
          close={close}
          search={search}
        />
      ) : null}
      <ModalFooter stickyBottom>
        <Button variant="default" onClick={close}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};

const ChartsActionButton: FC<{ job: Job }> = ({ job }) => {
  const [user] = useQueryUser();
  const nav = useNavigate();
  const l = useLocation();

  return (
    <Button
      size="compact-sm"
      variant="subtle"
      leftSection={<IconTimeline size={16} />}
      onClick={() => {
        const modalId = modals.open({
          title: "Charts",
          children: (
            <ChartsModal
              job={job}
              close={() => modals.close(modalId)}
              user={user}
              nav={nav}
              search={l.search}
            />
          ),
          size: "100%",
          xOffset: "1vw",
          yOffset: "1vh",
        });
      }}
    >
      Charts
    </Button>
  );
};

const DeleteButton: FC<{ job: Job }> = ({ job }) => {
  const [user] = useQueryUser();
  const { mutateAsync, isPending } = useJobDelete(user);

  return (
    <ButtonWithConfirm
      size="compact-sm"
      variant="subtle"
      leftSection={<IconTrash size={16} />}
      loading={isPending}
      onConfirm={() => {
        mutateAsync({ id: job.id! });
      }}
      confirmText="Delete"
      confirmBody="Are you sure you want to delete this job?"
      destructive
    >
      Delete
    </ButtonWithConfirm>
  );
};

const RepeatButton: FC<{ job: Job }> = ({ job }) => {
  const [user] = useQueryUser();
  const { mutateAsync, isPending } = useJobRepeat(user);

  return (
    <ButtonWithConfirm
      size="compact-sm"
      variant="subtle"
      leftSection={<IconRepeat size={16} />}
      confirmText="Repeat"
      confirmBody="Are you sure you want to repeat this job?"
      onConfirm={() => {
        mutateAsync({ id: job.id! });
      }}
      loading={isPending}
    >
      Repeat
    </ButtonWithConfirm>
  );
};

const StopButton: FC<{ job: Job }> = ({ job }) => {
  const [user] = useQueryUser();
  const { mutateAsync, isPending } = useJobCancel(user);

  return (
    <ButtonWithConfirm
      size="compact-sm"
      variant="subtle"
      leftSection={<IconPlayerStop size={16} />}
      confirmText="Stop"
      confirmBody="Are you sure you want to stop this job?"
      onConfirm={() => {
        mutateAsync({ id: job.id! });
      }}
      loading={isPending}
      destructive
      color="blue"
    >
      Stop
    </ButtonWithConfirm>
  );
};

const DoneCheck = () => {
  const theme = useMantineTheme();
  const color = getThemeColor("green", theme);

  return <IconCircleCheckFilled size={16} color={color} />;
};

export const JobCard: FC<{ job: Job }> = ({ job }) => {
  const isRunning = use$(() =>
    job.id ? state$.runningIds[job.id].get() : false,
  );

  return (
    <div>
      <Card className={cx(styles.card, styles.interactive)} withBorder>
        <Stack gap="xs">
          <Title
            order={5}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {job.name}
          </Title>
          <Text size="xs" c="dimmed">
            On <FormatTime t={job.attributes?.created} showTZ />
          </Text>
          <Group gap="sm">
            <Text fw="bold">{getJobLabel(job, isRunning)}</Text>
            <Progress
              value={job.percentage}
              {...getJobStatus(job, isRunning)}
              flex={1}
            />
            {job.percentage === 100 ? (
              <DoneCheck />
            ) : (
              <Text size="xs" c="dimmed">
                {job.percentage}%
              </Text>
            )}
          </Group>
          <JobDetailsCollapse job={job} />
          <Card.Section withBorder inheritPadding py="sm">
            <Group gap="xs" justify="flex-end">
              <Button.Group>
                {isRunning ? <StopButton job={job} /> : null}
                {job.cli ? <RepeatButton job={job} /> : null}
                {job.attributes?.stats ? (
                  <ChartsActionButton job={job} />
                ) : null}
              </Button.Group>
              <Divider orientation="vertical" />
              <DeleteButton job={job} />
            </Group>
          </Card.Section>
        </Stack>
      </Card>
    </div>
  );
};
