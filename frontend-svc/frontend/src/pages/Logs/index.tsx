import { useEffect, type FC } from "react";
import { observer, use$ } from "@legendapp/state/react";
import { Outlet } from "react-router-dom";

import { PageLayout } from "@/components/Layout/PageLayout";
import { Loader } from "@/components/Loader";
import { LogOwners, useLogOwners } from "@/hooks/logs";

import { LogsOwners } from "./LogsOwners";
import { LogsSkeleton } from "./LogsSkeleton";
import { logOwnersStore$ } from "./store";

import "./Logs.scss";

import { Columns, Left, Right } from "@/components/Columns";

const Loaded: FC<{ data: LogOwners["owners"] }> = observer(({ data }) => {
  useEffect(() => {
    logOwnersStore$.rawOwners.set(data);
  }, [data]);

  const total = use$(logOwnersStore$.total);

  return (
    <Columns>
      <Left heading={`Users (${total})`}>
        <LogsOwners />
      </Left>
      <Right>
        <Outlet />
      </Right>
    </Columns>
  );
});

const LogsLayout: FC = observer(() => {
  return (
    <PageLayout title="Logs">
      <Loader {...useLogOwners()} fallback={<LogsSkeleton />}>
        {(data) => <Loaded data={data} />}
      </Loader>
    </PageLayout>
  );
});

export { LogsLayout as Logs };
