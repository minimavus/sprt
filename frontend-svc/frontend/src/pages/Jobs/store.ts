import { observable } from "@legendapp/state";

import { Job } from "@/hooks/jobs";
import { formatDate } from "@/utils/time";

export type ArrangeBy = "none" | "date" | "protocol" | "server";

export const state$ = observable({
  jobs: [] as Job[],
  arranged: (): Job[] | [string, Job[]][] => {
    const by = state$.arrangeBy.get();
    if (by === "none") {
      return state$.jobs.get();
    }

    const datesForSort = new Map<string, Date | null>();

    const jobs = state$.jobs.get().reduce((acc, job) => {
      switch (by) {
        case "date": {
          const date = job.attributes?.created
            ? formatDate(job.attributes?.created)
            : "Unknown";
          if (!acc.has(date)) {
            datesForSort.set(date, job.attributes?.created ?? null);
            acc.set(date, []);
          }
          acc.get(date)?.push(job);
          break;
        }
        case "protocol": {
          const proto = job.attributes?.protocol ?? "Unknown";
          if (!acc.has(proto)) {
            acc.set(proto, []);
          }
          acc.get(proto)?.push(job);
          break;
        }
        case "server": {
          const server = job.attributes?.server ?? "Unknown";
          if (!acc.has(server)) {
            acc.set(server, []);
          }
          acc.get(server)?.push(job);
          break;
        }
      }
      return acc;
    }, new Map<string, Job[]>());

    const unsorted = Array.from(jobs.entries());
    unsorted.sort(([a], [b]) => {
      let compareA = a;
      let compareB = b;

      if (by === "date") {
        const dateA = datesForSort.get(a);
        const dateB = datesForSort.get(b);
        if (dateA && dateB) {
          compareA = dateA.toISOString();
          compareB = dateB.toISOString();
        }
      }

      return compareA.localeCompare(compareB);
    });
    if (by === "date") {
      unsorted.reverse();
    }
    return unsorted;
  },
  runningIds: {} as Record<string, boolean>,
  arrangeBy: "none" as ArrangeBy,
  running: (): Job[] => {
    return state$.jobs
      .get()
      .filter(
        (job) => job.id && state$.runningIds.get().hasOwnProperty(job.id),
      );
  },
  hasJobs: (): boolean => {
    return state$.jobs.get().length > 0;
  },
  setJobs: (jobs: Job[]) => {
    state$.jobs.set(jobs);
  },
  setRunning: (runningIds: string[]) => {
    state$.runningIds.assign(
      runningIds.reduce(
        (acc, id) => {
          acc[id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  },
  drop: () => {
    state$.jobs.set([]);
    state$.runningIds.set({});
  },
});
