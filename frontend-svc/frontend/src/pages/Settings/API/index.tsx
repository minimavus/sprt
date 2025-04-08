import { type FC } from "react";
import { Button, Group, Stack, Switch, TextInput, Title } from "@mantine/core";
import { AnimatePresence } from "framer-motion";

import { fadeInClampOut } from "@/animations";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { PageLayout } from "@/components/Layout/PageLayout";
import { Loader } from "@/components/Loader";
import { MotionedFlex } from "@/components/Motioned/MotionedFlex";
import {
  useAPISettings,
  useAPISettingsUpdate,
  type APISettings,
} from "@/hooks/settings/api";
import { useQueryUser } from "@/hooks/useQueryUser";

const APISettingsEdit: FC<{ settings: APISettings; isFetching: boolean }> = ({
  settings,
  isFetching,
}) => {
  const enabled = Boolean(settings?.token);
  const [user] = useQueryUser();
  const { mutateAsync, isPending } = useAPISettingsUpdate(user);
  const isBusy = isFetching || isPending;

  return (
    <Stack gap="sm" p="md">
      <Switch
        checked={enabled}
        onChange={(e) => {
          if (e.target.checked) mutateAsync({ action: "enable" });
          else mutateAsync({ action: "disable" });
        }}
        disabled={isBusy}
        label="Enable API access"
      />
      <AnimatePresence initial={false}>
        {enabled ? (
          <MotionedFlex {...fadeInClampOut} gap="sm" direction="column">
            <Title order={2}>Token</Title>
            <Group gap="xs" align="flex-end">
              <TextInput
                value={settings?.token || ""}
                label="Use the following token to access SPRT through API:"
                disabled={isBusy}
                readOnly
                rightSection={<CopyToClipboard value={settings?.token || ""} />}
              />
            </Group>
            <TextInput
              value={`Authorization: Bearer ${settings?.token || ""}`}
              label="It should be present in Authorization header as bearer authentication for each API call:"
              disabled={isBusy}
              readOnly
            />
            <div>
              <Button
                disabled={isBusy}
                onClick={() => {
                  mutateAsync({ action: "regen" });
                }}
              >
                Generate new token
              </Button>
            </div>
          </MotionedFlex>
        ) : null}
      </AnimatePresence>
    </Stack>
  );
};

const APISettingsWrap: FC = () => {
  const [user] = useQueryUser();

  return (
    <PageLayout title="API Settings" suspense fullHeight={false}>
      <Loader {...useAPISettings(user)}>
        {(data, fetchStatus) => (
          <APISettingsEdit
            settings={data}
            isFetching={fetchStatus === "fetching"}
          />
        )}
      </Loader>
    </PageLayout>
  );
};

export { APISettingsWrap as APISettings };
