import { Suspense, useEffect, type ComponentProps, type FC } from "react";
import type { Observable } from "@legendapp/state";
import { For, observer } from "@legendapp/state/react";
import { Stack } from "@mantine/core";
import { type DefaultError } from "@tanstack/react-query";
import cx from "classnames";
import { Await, useLoaderData, type LoaderFunction } from "react-router-dom";

import { CardGrid } from "@/components/CardGrid";
import { EmptyState } from "@/components/EmptyState";
import { AwaitError, DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { SkeletonLines } from "@/components/Skeleton";
import {
  getJobsOfUserKeyAndEnsureDefaults,
  useJobsOfUser,
  type Job,
  type Jobs,
} from "@/hooks/jobs";
import { queryClient } from "@/hooks/queryClient";
import { useQueryUser } from "@/hooks/useQueryUser";

import { ActionBar } from "./ActionBar";
import { JobCard } from "./JobCard";
import { state$ } from "./store";

const NoJobs: FC = () => {
  return <EmptyState title="No jobs found" />;
};

type ForItemProps<T, TProps> = ComponentProps<
  NonNullable<ComponentProps<typeof For<T, TProps>>["item"]>
>;

const CardOrRow: FC<ForItemProps<Job | [string, Job[]], object>> = observer(
  function CardOrRow({ item$ }) {
    const by = state$.arrangeBy.get();
    const item = item$.get();
    if (by === "none") {
      return <JobCard job={item as Job} />;
    }

    const key = (item$ as unknown as Observable<[string, Job[]]>)[0].get();
    const items = (item$ as unknown as Observable<[string, Job[]]>)[1];

    return (
      <>
        <h2 className={cx({ "text-uppercase": by === "protocol" })}>{key}</h2>
        <CardGrid key={key} minCardWidth={310}>
          <For each={items}>{(job$) => <JobCard job={job$.get()} />}</For>
        </CardGrid>
      </>
    );
  },
);

const JobsView: FC = observer(() => {
  const [qu] = useQueryUser();
  const { data, status, error } = useJobsOfUser(qu);

  useEffect(() => {
    if (!data) {
      state$.drop();
      return;
    }

    state$.jobs.set(data.jobs);
    state$.setRunning(data.running ?? []);
  }, [data]);

  const isArranged = state$.arrangeBy.get() !== "none";

  if (status === "pending") {
    return <SkeletonLines x={2} />;
  }

  if (status === "error") {
    return <DisplayError error={error} />;
  }

  if (!state$.hasJobs.get()) {
    return <NoJobs />;
  }

  return (
    <>
      <ActionBar />
      <CardGrid arranged={isArranged} minCardWidth={310}>
        <For each={state$.arranged} item={CardOrRow} />
      </CardGrid>
    </>
  );
});

type LoaderData = {
  init: Jobs | Promise<Jobs>;
};

const JobsPage: FC = () => {
  const data = useLoaderData() as LoaderData;

  return (
    <PageLayout title="Jobs" uncontained fullHeight={false}>
      <Stack flex={1}>
        <Suspense fallback={<DefaultLoaderFallback />}>
          <Await
            resolve={data.init}
            errorElement={<AwaitError before={null} />}
          >
            {() => <JobsView />}
          </Await>
        </Suspense>
      </Stack>
    </PageLayout>
  );
};

export const jobsLoader: LoaderFunction = async ({ request }) => {
  const user = new URL(request.url).searchParams.get("user");
  const queryKey = getJobsOfUserKeyAndEnsureDefaults(user);

  return {
    init: queryClient.ensureQueryData<unknown, DefaultError, Jobs>({
      queryKey,
    }),
  };
};

export { JobsPage as Jobs };
