import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Divider,
  Group,
  Modal,
  Skeleton,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { type FC, Suspense, useEffect, useState } from "react";
import {
  Controller,
  type DeepPartial,
  FormProvider,
  useForm,
  useWatch,
} from "react-hook-form";
import {
  Await,
  type LoaderFunction,
  useLoaderData,
  useParams,
} from "react-router-dom";

import { AwaitError, DisplayError } from "@/components/Error";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";
import {
  type CertTemplate,
  getCertTemplateKeyAndEnsureDefaults,
  useCertTemplateUpsert,
} from "@/hooks/certificates/templates";
import { queryClient } from "@/hooks/queryClient";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { getErrorMessage } from "@/utils/errors";

import styles from "./EditModal.module.scss";
import { ExtKeyUsageSet } from "./ExtKeyUsageSet";
import { formSchemaResolver, prepDefaultValues } from "./formHelpers";
import { KeyUsageSet } from "./KeyUsageSet";
import { LoadTemplate } from "./LoadTemplate";
import { Placeholders } from "./Placeholders";
import { Subject } from "./Subject";
import type { FormValues, LoaderData } from "./types";

const RSAParameters: FC = () => {
  return (
    <Controller<FormValues, "content.key_length">
      name="content.key_length"
      render={({ field, fieldState: { error } }) => (
        <TextInput
          label="RSA Key Length"
          {...field}
          error={getErrorMessage(error)}
        />
      )}
    />
  );
};

const ECDSAParameters: FC = () => {
  return (
    <Controller<FormValues, "content.e_curve">
      name="content.e_curve"
      render={({ field: { onChange, value, ...field } }) => (
        <LabeledSegmentedControl
          label="Curve"
          onChange={onChange}
          value={value || "P-256"}
          data={[
            { label: "P-224", value: "P-224" },
            { label: "P-256", value: "P-256" },
            { label: "P-384", value: "P-384" },
            { label: "P-521", value: "P-521" },
          ]}
          {...field}
        />
      )}
    />
  );
};

export const TemplateForm: FC<{
  withFriendlyName?: boolean;
  withVariables?: boolean;
}> = ({ withFriendlyName = true, withVariables = true }) => {
  const keyType = useWatch<FormValues, "content.key_type">({
    name: "content.key_type",
  });

  return (
    <Stack gap="sm">
      {withFriendlyName ? (
        <>
          <Title order={3}>General</Title>
          <Controller<FormValues, "friendly_name">
            name="friendly_name"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                label="Friendly Name"
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
        </>
      ) : null}
      <div className={styles.grid}>
        <Subject />
        <Stack gap="sm">
          <Title order={3}>Key Parameters</Title>
          <Controller<FormValues, "content.key_type">
            name="content.key_type"
            render={({ field: { onChange, value, ...field } }) => (
              <LabeledSegmentedControl
                label="Key Type"
                onChange={onChange}
                value={value || "rsa"}
                data={[
                  { label: "RSA", value: "rsa" },
                  { label: "ECDSA", value: "ecdsa" },
                ]}
                {...field}
              />
            )}
          />
          {keyType === "ecdsa" ? <ECDSAParameters /> : <RSAParameters />}
          <Title order={3}>Extensions</Title>
          <KeyUsageSet />
          <ExtKeyUsageSet />
        </Stack>
      </div>
      <div>
        <LoadTemplate />
      </div>
      {withVariables ? (
        <>
          <Divider size="xs" />
          <Placeholders />
        </>
      ) : null}
    </Stack>
  );
};

export const TemplateEditModal: FC = () => {
  const { id } = useParams();
  const data = useLoaderData() as LoaderData;
  const { isOpen, onClose } = useDelayedModalState();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    defaultValues: prepDefaultValues(data.template),
    // FIXME:
    resolver: zodResolver(formSchemaResolver) as any,
  });
  const { mutateAsync } = useCertTemplateUpsert();

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    await mutateAsync(data, {
      onError: (error) => {
        setSubmitError(error.message);
      },
      onSuccess: () => onClose(),
    });
  });

  useEffect(() => {
    return () => {
      form.reset();
    };
  }, []);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title={`${id ? "Edit" : "New"} certificate template`}
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <Stack gap="sm">
            <Suspense fallback={<Skeleton />}>
              <Await
                resolve={data.template}
                errorElement={<AwaitError before={null} />}
              >
                {() => <TemplateForm />}
              </Await>
            </Suspense>
            {submitError && <DisplayError error={submitError} before={null} />}
            <Group justify="flex-end" gap="xs">
              <Button
                type="button"
                onClick={onClose}
                variant="default"
                loading={
                  form.formState.isSubmitting || form.formState.isLoading
                }
              >
                Close
              </Button>
              <Button
                type="submit"
                loading={
                  form.formState.isSubmitting || form.formState.isLoading
                }
              >
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  );
};

export const templateLoader: LoaderFunction = async ({ params, request }) => {
  if (!params.id) {
    return {
      template: {
        id: "",
        owner: "",
        friendly_name: "",
        content: {
          key_usage: {},
          key_length: 2048,
          ext_key_usage: {},
          san: {
            rfc822Name: ["$MAC$"],
          },
          subject: {
            cn: ["$USERNAME$"],
            ou: ["SPRT"],
          },
          key_type: "rsa",
        },
        subject: "",
      } satisfies DeepPartial<CertTemplate>,
    };
  }

  const user = new URL(request.url).searchParams.get("user");
  const queryKey = getCertTemplateKeyAndEnsureDefaults(user, params.id);

  return {
    template: queryClient.ensureQueryData({
      queryKey,
    }),
  };
};
