import { Button, Group, Modal, Stack } from "@mantine/core";
import { type FC, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { useCertificateUpload } from "@/hooks/certificates";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";

const UploadCertificateModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user] = useQueryUser();
  const { upload } = useCertificateUpload({
    type: "identity",
    user,
  });

  const form = useForm({
    defaultValues: {},
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    await upload(data as any);
  });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title="Upload certificate"
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <Stack gap="sm">
            <Stack gap="sm">
              {submitError && (
                <DisplayError error={submitError} before={null} />
              )}
            </Stack>
            <Group justify="end" gap="xs">
              <Button
                type="button"
                onClick={onClose}
                variant="default"
                loading={form.formState.isSubmitting}
              >
                Close
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Upload
              </Button>
            </Group>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  );
};

export { UploadCertificateModal as UploadIdentityCertificate };
