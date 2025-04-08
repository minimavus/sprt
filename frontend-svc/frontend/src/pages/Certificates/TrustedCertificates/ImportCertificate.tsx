import { FC, useState } from "react";
import { Button, Modal, Stack, Textarea } from "@mantine/core";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { useCertificateUpload } from "@/hooks/certificates";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

import { niceUploadError } from "../utils";

type ImportCertificateFormFields = {
  pem: string;
};

const ImportCertificateModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user] = useQueryUser();
  const { upload } = useCertificateUpload({
    type: "trusted",
    user,
  });

  const form = useForm<ImportCertificateFormFields>({
    defaultValues: {
      pem: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    await upload({
      file: data.pem,
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (error) => {
        setSubmitError(niceUploadError(error));
      },
    });
  });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title="Import certificate"
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <Stack gap="sm">
            <Stack gap="sm">
              <Controller<ImportCertificateFormFields, "pem">
                name="pem"
                rules={{ required: "Certificate(s) are required" }}
                render={({ field, fieldState: { error } }) => (
                  <Textarea
                    label="Certificate(s)"
                    {...field}
                    rows={20}
                    description="Paste your certificate(s) in PEM format here. You can paste multiple certificates at once."
                    error={getErrorMessage(error)}
                  />
                )}
              />
              {submitError && (
                <DisplayError error={submitError} before={null} />
              )}
            </Stack>
            <ModalFooter>
              <Button
                type="button"
                onClick={onClose}
                variant="default"
                loading={form.formState.isSubmitting}
              >
                Close
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Import
              </Button>
            </ModalFooter>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  );
};

export { ImportCertificateModal as ImportTrustedCertificate };
