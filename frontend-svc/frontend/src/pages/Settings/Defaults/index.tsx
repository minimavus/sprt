import { FC } from "react";
import { Stack } from "@mantine/core";

import { PageLayout } from "@/components/Layout/PageLayout";
import { Loader } from "@/components/Loader";
import { UserDefaults, useUserDefaults } from "@/hooks/settings/defaults";
import { useQueryUser } from "@/hooks/useQueryUser";

const DefaultsSettings: FC<{ data: UserDefaults }> = ({ data }) => {
  console.log("FIXME: unused data", data);
  return (
    <Stack gap="sm" p="md">
      Got some
    </Stack>
  );
};

const HOC: FC = () => {
  const [user] = useQueryUser();

  return (
    <PageLayout title="Defaults" suspense fullHeight={false}>
      <Loader {...useUserDefaults(user)}>
        {(data) => <DefaultsSettings data={data} />}
      </Loader>
    </PageLayout>
  );
};

export { HOC as DefaultsSettings };
