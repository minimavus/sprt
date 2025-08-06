import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Stack } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { type FC, useEffect } from "react";
import {
  FormProvider,
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { SkeletonLines } from "@/components/Skeleton";
import {
  getServerSettingsKey,
  NewServerSchema,
  type ServerSettings,
  ServerSettingsSchema,
  useServerSettings,
  useServerSettingsUpsert,
} from "@/hooks/settings/servers";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { queryGetFn } from "@/hooks/useGetQuery";
import { useQueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { orMe } from "@/utils/orMe";

import { EditForm } from "./EditForm";
import { emptyServer } from "./EditForm/emptyServer";

export const Server: FC = () => {
  const qc = useQueryClient();
  const [user] = useQueryUser();
  const m = useParams<{ id: string }>();
  const { isOpen, onClose } = useDelayedModalState();
  const { data, status, error } = useServerSettings(
    m.id !== "add" ? m.id! : undefined,
    user,
  );
  const { mutateAsync } = useServerSettingsUpsert(user);

  useEffect(() => {
    form.reset(data, {
      keepDirtyValues: false,
      keepErrors: false,
      keepDirty: false,
      keepValues: false,
      keepDefaultValues: false,
      keepIsSubmitted: false,
      keepIsSubmitSuccessful: false,
      keepTouched: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });
  }, [data]);

  const isNew = m.id === "add";

  const form = useForm<ServerSettings>({
    defaultValues: isNew
      ? emptyServer()
      : () =>
          qc.ensureQueryData({
            queryKey: getServerSettingsKey(m.id!, orMe(user)),
            queryFn: queryGetFn({
              url: api.v2`settings/servers/${m.id!}`,
              schema: ServerSettingsSchema,
              params: { user },
            }),
          }),
    resolver: zodResolver(
      isNew ? NewServerSchema : ServerSettingsSchema,
    ) as any,
  });

  const onSubmit: SubmitHandler<ServerSettings> = async (values) => {
    try {
      await mutateAsync(values).then(() => onClose());
    } catch (_e) {
      // ...nothing
    }
  };

  const onErr: SubmitErrorHandler<ServerSettings> = (errs) => {
    console.log(errs);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title={isNew ? "New server" : "Edit server"}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onErr)}>
          <Stack gap="sm">
            {status === "pending" && m.id !== "add" ? (
              <SkeletonLines x={4} />
            ) : status === "error" ? (
              <DisplayError error={error} />
            ) : (
              <EditForm />
            )}
            <ModalFooter>
              <Button
                onClick={onClose}
                variant="default"
                loading={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save
              </Button>
            </ModalFooter>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  );
};
