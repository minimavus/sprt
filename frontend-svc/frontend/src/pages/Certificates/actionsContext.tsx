import {
  createContext,
  use,
  useCallback,
  type FC,
  type ReactNode,
} from "react";
import {
  Button,
  Group,
  noop,
  PasswordInput,
  SegmentedControl,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import {
  useCertificatesDelete,
  useCertificatesExport,
  useCertificateUpdate,
  type CertID,
  type Certificate,
  type CertType,
} from "@/hooks/certificates";
import { QueryUser, useQueryUser } from "@/hooks/useQueryUser";

type ActionOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type Actions = {
  exportCertificates: (ids: CertID[], options?: ActionOptions) => void;
  deleteCertificates: (ids: CertID[], options?: ActionOptions) => void;
  renameCertificate: (cert: Certificate, options?: ActionOptions) => void;
};

const ActionsContext = createContext<Actions>({
  exportCertificates: noop,
  deleteCertificates: noop,
  renameCertificate: noop,
});

export const useCertificateActions = () => {
  return use(ActionsContext);
};

type currentAction =
  | { action: "export"; payload: CertID[]; options?: ActionOptions }
  | { action: "delete"; payload: CertID[]; options?: ActionOptions }
  | { action: "rename"; payload: Certificate; options?: ActionOptions };

type CertExportDefaultValues = {
  includeChain: boolean;
  what: "cert" | "cert-with-key";
};

type IdentityCertExportDefaultValues = {
  password: string;
} & CertExportDefaultValues;

const getDefaultValues = <
  T extends CertType,
  R = T extends "identity"
    ? IdentityCertExportDefaultValues
    : CertExportDefaultValues,
>(
  type: T,
): R => {
  return {
    includeChain: true,
    what: "cert",
    ...(type === "identity" ? { what: "cert-with-key", password: "" } : {}),
  } as R;
};

const ExportModal: FC<
  Extract<currentAction, { action: "export" }> & {
    closeModal: () => void;
    user: QueryUser;
  }
> = ({ payload, options, closeModal, user }) => {
  const { exportAsync, error } = useCertificatesExport();

  const form = useForm({
    defaultValues: getDefaultValues(payload[0].type),
  });
  const needPass =
    useWatch<IdentityCertExportDefaultValues, "what">({
      control: form.control as any,
      name: "what",
    }) === "cert-with-key";
  const isIdentity =
    payload[0].type === "identity" || payload[0].type === "signer";

  const onSubmit = form.handleSubmit(async (data) => {
    await exportAsync(
      payload,
      {
        include_chain: data.includeChain,
        what: data.what,
        pass: (data as IdentityCertExportDefaultValues).password,
        onSuccess: () => {
          closeModal();
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error as any);
        },
      },
      user,
    );
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="xs">
          <Stack gap="xs">
            {isIdentity ? (
              <>
                <Controller<IdentityCertExportDefaultValues, "what">
                  name="what"
                  render={({ field: { onChange, ...field } }) => (
                    <div>
                      <SegmentedControl
                        onChange={(value) => onChange(value)}
                        data={[
                          {
                            label: "Certificate only",
                            value: "cert",
                          },
                          {
                            label: "Certificate with private key",
                            value: "cert-with-key",
                          },
                        ]}
                        {...field}
                      />
                    </div>
                  )}
                />
                {needPass ? (
                  <Controller<IdentityCertExportDefaultValues, "password">
                    name="password"
                    render={({ field }) => (
                      <PasswordInput
                        {...field}
                        type="password"
                        label="Password"
                      />
                    )}
                  />
                ) : null}
              </>
            ) : null}
            <Controller
              name="includeChain"
              render={({ field: { value, onChange, ...field } }) => (
                <Switch
                  {...field}
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  label="Include full chain"
                />
              )}
            />
            {error ? <DisplayError error={error} /> : null}
          </Stack>
          <Group justify="end" gap="xs">
            <Button
              onClick={closeModal}
              variant="default"
              loading={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Export
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};

type RenameFormFields = {
  name: string;
};

const RenameModal: FC<
  Extract<currentAction, { action: "rename" }> & {
    closeModal: () => void;
    user: QueryUser;
  }
> = ({ payload, options, closeModal, user }) => {
  const form = useForm<RenameFormFields>({
    defaultValues: {
      name: payload.friendly_name!,
    },
  });
  const { mutateAsync: renameAsync, isPending } = useCertificateUpdate();

  const onSubmit = form.handleSubmit(async (data) => {
    await renameAsync(
      {
        id: payload.id,
        type: payload.type,
        user,
        data,
      },
      {
        ...(options?.onSuccess ? { onSuccess: options.onSuccess } : {}),
        ...(options?.onError
          ? { onError: (err) => options?.onError?.(err) }
          : {}),
      },
    ).finally(closeModal);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <Controller<RenameFormFields, "name">
            name="name"
            render={({ field }) => <TextInput label="Name" {...field} />}
          />
          <Group justify="end" gap="xs">
            <Button
              type="button"
              onClick={closeModal}
              variant="default"
              loading={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};

export const ActionsProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useQueryUser();

  const { mutateAsync: deleteAsync } = useCertificatesDelete();
  const confirm = useDynamicConfirmation();

  const exportCertificates = useCallback(
    (ids: CertID[], options?: ActionOptions) => {
      const modalId = modals.open({
        title: "Export",
        children: (
          <ExportModal
            payload={ids}
            options={options}
            closeModal={() => modals.close(modalId)}
            user={user}
            action="export"
          />
        ),
      });
    },
    [user],
  );

  const deleteCertificates = useCallback(
    (ids: CertID[], options?: ActionOptions) => {
      confirm({
        title: "Delete",
        children: `Are you sure you want to delete ${ids.length > 1 ? `${ids.length} ` : ""}certificate${ids.length > 1 ? "s" : ""}?`,
        onConfirm: async () => {
          try {
            await deleteAsync(
              {
                ids,
                user,
              },
              {
                ...(options?.onSuccess ? { onSuccess: options.onSuccess } : {}),
                ...(options?.onError
                  ? { onError: (err) => options?.onError?.(err) }
                  : {}),
              },
            );
            options?.onSuccess?.();
          } catch (error) {
            options?.onError?.(error as any);
          }
        },
        confirmText: "Delete",
        destructive: true,
      });
    },
    [confirm, deleteAsync, user],
  );

  const renameCertificate = useCallback(
    (cert: Certificate, options?: ActionOptions) => {
      const modalId = modals.open({
        title: "Rename certificate",
        children: (
          <RenameModal
            payload={cert}
            options={options}
            closeModal={() => modals.close(modalId)}
            user={user}
            action="rename"
          />
        ),
      });
    },
    [user],
  );

  return (
    <ActionsContext
      value={{
        exportCertificates,
        deleteCertificates,
        renameCertificate,
      }}
    >
      {children}
    </ActionsContext>
  );
};
