import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Modal,
  PasswordInput,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { type FC, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { DisplayError } from "@/components/Error";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { useCertificateUpload } from "@/hooks/certificates";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

import { niceUploadError } from "../utils";

const ImportCertificateSchema = z.object({
  friendly_name: z.string().optional(),
  pem: z.string().min(1),
  key: z.string().min(1),
  password: z.string().optional(),
});

type ImportCertificateFormValues = z.infer<typeof ImportCertificateSchema>;

const ImportCertificateModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user] = useQueryUser();
  const { upload } = useCertificateUpload({
    type: "identity",
    user,
  });

  const form = useForm<ImportCertificateFormValues>({
    defaultValues: {
      friendly_name: "",
      pem: "",
      key: "",
      password: "",
    },
    resolver: zodResolver(ImportCertificateSchema),
  });

  const onSubmit = form.handleSubmit(async ({ pem, ...data }) => {
    setSubmitError(null);
    await upload({
      file: pem,
      data,
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
              <Controller<ImportCertificateFormValues, "friendly_name">
                name="friendly_name"
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    label="Friendly name"
                    {...field}
                    error={getErrorMessage(error)}
                  />
                )}
              />
              <Controller<ImportCertificateFormValues, "pem">
                name="pem"
                render={({ field, fieldState: { error } }) => (
                  <Textarea
                    label="Certificate (PEM)"
                    {...field}
                    rows={10}
                    error={getErrorMessage(error)}
                  />
                )}
              />
              <Controller<ImportCertificateFormValues, "key">
                name="key"
                render={({ field, fieldState: { error } }) => (
                  <Textarea
                    label="Key (PEM)"
                    {...field}
                    rows={10}
                    error={getErrorMessage(error)}
                  />
                )}
              />
              <Controller<ImportCertificateFormValues, "password">
                name="password"
                render={({ field, fieldState: { error } }) => (
                  <PasswordInput
                    label="Passphrase"
                    type="password"
                    {...field}
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

export { ImportCertificateModal as ImportIdentityCertificate };
