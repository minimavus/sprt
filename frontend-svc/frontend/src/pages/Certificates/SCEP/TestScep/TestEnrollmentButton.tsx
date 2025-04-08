import { FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCircleNumber2 } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { ScepServerWithParsedCerts } from "@/hooks/certificates/scep";
import { CertTemplate } from "@/hooks/certificates/templates";
import { useQueryUser } from "@/hooks/useQueryUser";
import { TemplateForm } from "@/pages/Certificates/CertificateTemplates/EditModal";
import {
  prepDefaultValues,
  formSchemaResolver as templateFormResolver,
} from "@/pages/Certificates/CertificateTemplates/EditModal/formHelpers";
import { FormValues as TemplateFormValues } from "@/pages/Certificates/CertificateTemplates/EditModal/types";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { toast } from "@/utils/toasts";

const defaultTemplate = (user: string): CertTemplate => ({
  friendly_name: "Test enrollment",
  id: "enroll-csr",
  owner: user,
  content: {
    ext_key_usage: {
      clientAuth: true,
      serverAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
    },
    key_usage: {
      cRLSign: false,
      dataEncipherment: false,
      decipherOnly: false,
      digitalSignature: true,
      encipherOnly: false,
      keyAgreement: false,
      keyCertSign: false,
      keyEncipherment: false,
      nonRepudiation: false,
    },
    san: {
      dNSName: ["test.example.com"],
      iPAddress: ["1.1.1.1"],
    },
    subject: {
      cn: ["Test"],
      ou: ["SPRT"],
    },
    key_type: "rsa",
    key_length: 2048,
    e_curve: "P-256",
  },
  subject: "",
});

export const TestEnrollmentButton: FC<{ disabled: boolean }> = ({
  disabled,
}) => {
  const [opened, { toggle, close }] = useDisclosure();
  const [user] = useQueryUser();

  const [caCerts, name, signer, url, challenge] = useWatch<
    ScepServerWithParsedCerts,
    ["ca_certificates", "name", "signer", "url", "challenge"]
  >({
    name: ["ca_certificates", "name", "signer", "url", "challenge"],
  });

  const form = useForm<TemplateFormValues>({
    defaultValues: prepDefaultValues(defaultTemplate(user ?? "me")),
    // FIXME:
    resolver: zodResolver(templateFormResolver) as any,
  });

  const { mutateAsync, error, reset } = useMutation({
    mutationFn: async ({
      template,
      ca_certificates,
      name,
      signer,
      url,
      challenge,
    }: {
      template: TemplateFormValues;
      name: string;
      signer: string;
      url: string;
      ca_certificates: string[];
      challenge: string;
    }) => {
      await axios.post(api.v2`/scep/test/enroll`, {
        csr_template: template,
        ca_certificates,
        name,
        signer,
        url,
        challenge,
      });
    },
    onError(error) {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess() {
      toast.success({
        title: "Success",
        message: "Enrollment successful",
      });
      close();
    },
  });

  const handleSubmit = form.handleSubmit(
    async (template) => {
      await mutateAsync({
        template,
        ca_certificates: caCerts?.map((c) => c.body!) ?? [],
        name,
        signer,
        url,
        challenge: challenge ?? "",
      });
    },
    (errors) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(errors),
      });
    },
  );

  return (
    <>
      <Button
        onClick={() => {
          reset();
          toggle();
        }}
        size="compact-sm"
        leftSection={<IconCircleNumber2 size={16} />}
        disabled={disabled}
      >
        Test enrollment
      </Button>

      <Modal opened={opened} onClose={close} title="Test Enrollment" size="xl">
        <FormProvider {...form}>
          <Stack gap="sm">
            <TemplateForm withFriendlyName={false} withVariables={false} />
            {error ? <DisplayError error={error} /> : null}
            <ModalFooter>
              <Button
                onClick={close}
                variant="default"
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleSubmit}
                loading={form.formState.isSubmitting}
              >
                Test
              </Button>
            </ModalFooter>
          </Stack>
        </FormProvider>
      </Modal>
    </>
  );
};
