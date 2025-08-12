import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconDeviceFloppy, IconDownload } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";
import sanitize from "sanitize-filename";

import { DisplayError } from "@/components/Error";
import { InputHelp } from "@/components/Inputs/InputHelp";
import { KeyValue } from "@/components/KeyValue";
import { DefaultLoaderFallback } from "@/components/Loader";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { StatusIcon } from "@/components/StatusIcon";
import { useCertificatesOfType } from "@/hooks/certificates";
import {
  type ScepCaCertificate,
  type ScepServerWithParsedCerts,
  useScepServer,
  useScepServerUpsert,
} from "@/hooks/certificates/scep";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { type QueryUser, useQueryUser } from "@/hooks/useQueryUser";
import { download } from "@/utils/download";
import { maybeError } from "@/utils/errors";
import { formatTime } from "@/utils/time";

import { getSigningCertificatesOptions } from "./getSigningCertificatesOptions";
import { TestButtons } from "./TestScep/TestButtons";

const emptyDefaultValues = (user: QueryUser): ScepServerWithParsedCerts => ({
  ca_certificates: [],
  id: "",
  name: "",
  url: "",
  signer: "",
  owner: user ?? "",
  challenge: "",
});

const Form: FC = () => {
  const [user] = useQueryUser();
  const { data: certificates } = useCertificatesOfType("signer", { user });

  return (
    <>
      <Controller<ScepServerWithParsedCerts, "name">
        name="name"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Name"
            placeholder="Name"
            required
            error={maybeError(error)}
          />
        )}
      />
      <Controller<ScepServerWithParsedCerts, "url">
        name="url"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="SCEP server URL"
            placeholder="URL"
            required
            error={maybeError(error)}
          />
        )}
      />
      <Controller<ScepServerWithParsedCerts, "signer">
        name="signer"
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            label="Signing certificate"
            placeholder="Select certificate"
            required
            error={maybeError(error)}
            data={getSigningCertificatesOptions(certificates?.certificates)}
          />
        )}
      />
      <Controller<ScepServerWithParsedCerts, "challenge">
        name="challenge"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label={
              <>
                Challenge password{" "}
                <InputHelp
                  help={
                    "Typically, only one certificate can be issued per challenge password, " +
                    "making it suitable only for enrollment testing. " +
                    "It is advised to disable the password requirement on the SCEP server " +
                    "during regular operation or configure single password."
                  }
                />
              </>
            }
            placeholder="Password"
            error={maybeError(error)}
          />
        )}
      />
    </>
  );
};

const ShowCACertificates: FC = () => {
  const caCertificates = useWatch<ScepServerWithParsedCerts, "ca_certificates">(
    { name: "ca_certificates" },
  );

  if (!caCertificates?.length) {
    return null;
  }

  const getPairs = (cert: ScepCaCertificate) => {
    const p: [string, ReactNode][] = [
      ["Issuer", cert.issuer],
      ["Serial number", cert.serial],
      ["Valid from", cert.valid_from ? formatTime(cert.valid_from) : "Unknown"],
      ["Valid till", cert.valid_to ? formatTime(cert.valid_to) : "Unknown"],
    ];

    if (cert.self_signed) {
      p.push(["Self-signed", <StatusIcon status="positive" size={16} />]);
    }

    return p;
  };

  return (
    <Box>
      <Title order={4} mb="sm">
        CA Certificates
      </Title>
      <Stack gap="sm">
        {caCertificates.map((cert) => (
          <Paper key={cert.serial} shadow="none" withBorder p="sm">
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Title order={5}>{cert.friendly_name}</Title>
                {cert.is_expired ? (
                  <Tooltip label="Expired" withArrow>
                    <StatusIcon status="warning" size={16} />
                  </Tooltip>
                ) : null}
              </Group>
              <Button.Group>
                {cert.body ? (
                  <Tooltip
                    label="Download"
                    withArrow
                    onClick={() => {
                      download(
                        cert.body!,
                        sanitize(`${cert.subject || "certificate"}.pem`),
                        "application/x-pem-file",
                      );
                    }}
                  >
                    <ActionIcon variant="subtle" color="gray">
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
                <Tooltip label="Save as trusted" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      console.log("TODO: save as trusted");
                    }}
                  >
                    <IconDeviceFloppy size={16} />
                  </ActionIcon>
                </Tooltip>
              </Button.Group>
            </Group>
            <KeyValue gap={0} pairs={getPairs(cert)} />
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

const isNew = (id: string | undefined) => id === "new";

export const SCEPServerEdit: FC = () => {
  const { isOpen, onClose } = useDelayedModalState({ levelsUp: 2 });

  const [user] = useQueryUser();
  const { id } = useParams<{ id: string }>();
  const { data, error, status } = useScepServer(
    isNew(id) ? undefined : id,
    user,
  );
  const { mutateAsync, error: submitError, reset } = useScepServerUpsert();

  const form = useForm<ScepServerWithParsedCerts>({
    defaultValues: emptyDefaultValues(user),
    values: data ?? undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        id: isNew(id) ? undefined : id,
        name: values.name,
        url: values.url,
        signer: values.signer,
        challenge: values.challenge,
        user,
        ca_certificates:
          values.ca_certificates?.map((cert) => cert.body!) ?? [],
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  });

  return (
    <Modal.Stack>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title="Edit SCEP Server"
        size="xl"
      >
        <FormProvider {...form}>
          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              {!isNew(id) && status === "pending" ? (
                <DefaultLoaderFallback />
              ) : status === "error" ? (
                <DisplayError error={error} />
              ) : (
                <>
                  <Form />
                  <TestButtons />
                  <ShowCACertificates />
                </>
              )}
              {error ? <DisplayError error={submitError} /> : null}
              <ModalFooter>
                <Button onClick={onClose} variant="default">
                  Cancel
                </Button>
                <Button
                  color="blue"
                  type="submit"
                  loading={form.formState.isSubmitting}
                  disabled={!isNew(id) && status !== "success"}
                >
                  Save
                </Button>
              </ModalFooter>
            </Stack>
          </form>
        </FormProvider>
      </Modal>
    </Modal.Stack>
  );
};
