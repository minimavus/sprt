import {
  Button,
  type ComboboxData,
  Divider,
  Modal,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { type FC, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { InputHelp } from "@/components/Inputs/InputHelp";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { useCertificateUpload } from "@/hooks/certificates";
import { type ScepServer, useScepServers } from "@/hooks/certificates/scep";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

import { TemplateForm } from "../CertificateTemplates/EditModal";
import { prepDefaultValues } from "../CertificateTemplates/EditModal/formHelpers";
import type { FormValues as TemplateFormValues } from "../CertificateTemplates/EditModal/types";

interface FromScepFormValues {
  scep_server: string;
  challenge: string;
  friendly_name: string;
  content: TemplateFormValues["content"];
  withKeyUsage: TemplateFormValues["withKeyUsage"];
  withExtKeyUsage: TemplateFormValues["withExtKeyUsage"];
}

const getScepServersOptions = (servers: ScepServer[]): ComboboxData =>
  servers.map((s) => ({ value: s.id, label: s.name }));

const ScepServerSelect: FC<{
  servers: ScepServer[] | undefined;
  loading: boolean;
}> = ({ servers, loading }) => {
  const server = useWatch<FromScepFormValues>({ name: "scep_server" });

  if (!servers?.length && !loading) {
    return <DisplayError error="No SCEP servers available" before={null} />;
  }

  return (
    <>
      <Controller<FromScepFormValues, "scep_server">
        name="scep_server"
        render={({ field }) => (
          <Select
            {...field}
            data={servers ? getScepServersOptions(servers) : []}
            allowDeselect={false}
            label="SCEP server"
            disabled={loading}
            placeholder={loading ? "Loading..." : "Select SCEP server"}
            required
          />
        )}
      />
      <Controller<FromScepFormValues, "challenge">
        name="challenge"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label={
              <>
                Challenge password{" "}
                <InputHelp help="Will override SCEP server challenge password if set" />
              </>
            }
            placeholder="Challenge"
            error={getErrorMessage(error)}
            disabled={!server}
          />
        )}
      />
    </>
  );
};

const getDefaultValues = async (): Promise<FromScepFormValues> => {
  const { withExtKeyUsage, withKeyUsage, content } = await prepDefaultValues({
    content: {
      key_type: "rsa",
      key_length: 2048,
      e_curve: "P-256",
      subject: {
        cn: ["Example"],
        o: ["Example"],
        ou: ["SPRT"],
      },
      san: {
        dNSName: [],
        iPAddress: [],
      },
      key_usage: {
        digitalSignature: true,
        nonRepudiation: false,
        keyEncipherment: false,
        dataEncipherment: false,
        keyAgreement: false,
        keyCertSign: false,
        cRLSign: false,
        encipherOnly: false,
        decipherOnly: false,
      },
      ext_key_usage: {
        serverAuth: false,
        clientAuth: true,
        codeSigning: false,
        emailProtection: false,
        timeStamping: false,
      },
    },
  } as any)();

  return {
    scep_server: "",
    challenge: "",
    friendly_name: "",
    content,
    withExtKeyUsage,
    withKeyUsage,
  };
};

const FromScepModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user] = useQueryUser();
  const { upload } = useCertificateUpload({
    type: "identity",
    user,
  });
  const {
    data: scepServers,
    error: scepError,
    isLoading: isLoadingScep,
  } = useScepServers(user);

  const form = useForm<FromScepFormValues>({
    defaultValues: () => getDefaultValues(),
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    console.log("TODO: request certificate from SCEP");
    await upload(data as any);
  });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title="Request certificate from SCEP"
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <Stack gap="sm">
            <Stack gap="sm">
              <Title order={3}>General</Title>
              {scepError && (
                <DisplayError
                  error={scepError}
                  before="Failed to get SCEP servers"
                />
              )}
              {!scepError ? (
                <ScepServerSelect
                  servers={scepServers}
                  loading={isLoadingScep}
                />
              ) : null}

              <Controller<FromScepFormValues, "friendly_name">
                name="friendly_name"
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    {...field}
                    label="Certificate friendly name"
                    placeholder="Certificate friendly name"
                    required
                    error={getErrorMessage(error)}
                  />
                )}
              />

              <Divider label="CSR template" labelPosition="left" />

              <TemplateForm withFriendlyName={false} withVariables={false} />

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
                Request
              </Button>
            </ModalFooter>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  );
};

export { FromScepModal as IdentityCertificateFromScep };
