import { FC } from "react";
import { Tabs } from "@mantine/core";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { PageLayout } from "@/components/Layout/PageLayout";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useDictionaryTypes } from "@/hooks/settings/dictionaries";

const DictionariesSettings: FC = () => {
  const { data, status, error } = useDictionaryTypes();
  const { type: selectedType } = useParams<{ type: string }>();
  const nav = useNavigate();
  const l = useLocation();

  if (status === "error") return <DisplayError error={error} />;
  if (status === "pending") return <DefaultLoaderFallback />;

  return (
    <Tabs
      defaultValue={selectedType}
      value={selectedType}
      orientation="vertical"
      onChange={(value) => {
        nav(`/settings/dictionaries/${value}${l.search}`, { relative: "path" });
      }}
      flex={1}
    >
      <Tabs.List pt="md" pb="md">
        {data.map((d) => (
          <Tabs.Tab key={d.name} value={d.name}>
            {d.title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {selectedType ? (
        <Tabs.Panel value={selectedType} p="md" flex={1}>
          <Outlet />
        </Tabs.Panel>
      ) : null}
    </Tabs>
  );
};

const HOC: FC = () => (
  <PageLayout title="Dictionaries" suspense fullHeight={false}>
    <DictionariesSettings />
  </PageLayout>
);

export { HOC as DictionariesSettings };
