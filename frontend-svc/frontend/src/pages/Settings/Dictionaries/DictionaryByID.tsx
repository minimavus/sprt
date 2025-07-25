import {
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import {
  IconArrowLeftDashed,
  IconDeviceFloppy,
  IconTrash,
} from "@tabler/icons-react";
import { type ComponentProps, type FC, useMemo } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { ButtonWithConfirm } from "@/components/Buttons/ButtonWithConfirm";
import { DisplayError } from "@/components/Error";
import { SkeletonLines } from "@/components/Skeleton";
import {
  type FullDictionary,
  useDictionaryByID,
  useDictionaryDelete,
  useDictionaryTypes,
  useDictionaryUpsert,
} from "@/hooks/settings/dictionaries";
import { useQueryUser } from "@/hooks/useQueryUser";
import { usePermission, useUser } from "@/hooks/useUser";
import { getErrorMessage } from "@/utils/errors";

import { getFormDefaultValues } from "./utils";

type Params = {
  id: string;
  type: string;
};

const useIsNewDictionary = () => {
  return useParams<Params>().id === "add";
};

const globalDictOwner = "__GLOBAL__" as const;

const Controls: FC<{
  onDelete?: ComponentProps<typeof ButtonWithConfirm>["onConfirm"];
  isLoading?: boolean;
  canDelete: boolean;
  canSave: boolean;
}> = ({ onDelete, isLoading = false, canDelete, canSave }) => {
  const nav = useNavigate();
  const l = useLocation();

  return (
    <Group gap="xs" justify="space-between">
      <Button
        variant="subtle"
        onClick={() => nav(`..${l.search}`, { relative: "path" })}
        type="button"
        leftSection={<IconArrowLeftDashed size={16} />}
      >
        Back
      </Button>
      <Group gap="xs" justify="flex-end">
        {onDelete ? (
          <ButtonWithConfirm
            destructive
            confirmText="Delete"
            onConfirm={onDelete}
            confirmBody={"Are you sure you want to delete this dictionary?"}
            loading={isLoading}
            disabled={!canDelete}
            leftSection={<IconTrash size={16} />}
          >
            Delete
          </ButtonWithConfirm>
        ) : null}
        <Button
          variant="primary"
          type="submit"
          loading={isLoading}
          disabled={!canSave}
          leftSection={<IconDeviceFloppy size={16} />}
        >
          Save
        </Button>
      </Group>
    </Group>
  );
};

const useTypesOptions = () => {
  const { data: rawTypes } = useDictionaryTypes();
  return useMemo(
    () => rawTypes?.map((t) => ({ label: t.title, value: t.name })) || [],
    [rawTypes],
  );
};

const DictionaryByID: FC = () => {
  const [qu] = useQueryUser();
  const { id, type } = useParams<Params>();
  const { data, status, error } = useDictionaryByID(id!, qu);
  const form = useForm<FullDictionary>({ values: data });
  const user = useUser();
  const nav = useNavigate();
  const l = useLocation();
  const { mutateAsync: deleteAsync, isPending: isDeleting } =
    useDictionaryDelete();
  const { mutateAsync, isPending } = useDictionaryUpsert();
  const canUpdateGlobal = usePermission("dictionaries.update.global");
  const canDeleteGlobal = usePermission("dictionaries.delete.global");
  const isGlobal =
    useWatch<FullDictionary, "owner">({
      name: "owner",
      control: form.control,
    }) === globalDictOwner;
  const th = useMantineTheme();

  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync({ ...values, user: qu });
    nav(`../../${values.type}${l.search}`, { relative: "path" });
  });

  const types = useTypesOptions();

  if (status === "error") {
    return <DisplayError error={error} />;
  }
  if (status === "pending") {
    return <SkeletonLines x={3} />;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <Controller<FullDictionary, "name">
            name="name"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                id="name"
                label="Name"
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<FullDictionary, "type">
            name="type"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Type"
                data={types}
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<FullDictionary, "owner">
            name="owner"
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                {...field}
                checked={value === globalDictOwner}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? globalDictOwner
                      : qu || user.data?.UserID,
                  )
                }
                disabled={!canUpdateGlobal}
                label="Globally available"
              />
            )}
          />
          <Controller<FullDictionary, "content">
            name="content"
            render={({ field, fieldState: { error } }) => (
              <Textarea
                id="content"
                label="Content"
                {...field}
                autosize
                minRows={10}
                maxRows={30}
                error={getErrorMessage(error)}
                styles={
                  type === "radius"
                    ? { input: { fontFamily: th.fontFamilyMonospace } }
                    : undefined
                }
              />
            )}
          />
          <Controls
            onDelete={() =>
              deleteAsync({ id: id!, user: qu, type: type! }).then(() => {
                nav(`..${l.search}`, { relative: "path" });
              })
            }
            isLoading={isPending || isDeleting}
            canDelete={isGlobal ? canDeleteGlobal || false : true}
            canSave={isGlobal ? canUpdateGlobal || false : true}
          />
        </Stack>
      </form>
    </FormProvider>
  );
};

const NewDictionary: FC = () => {
  const [u] = useQueryUser();
  const { data: userData } = useUser();
  const { type: initialType } = useParams<Params>();
  const types = useTypesOptions();
  const canCreateGlobal = usePermission("dictionaries.create.global");
  const { mutateAsync } = useDictionaryUpsert();
  const nav = useNavigate();
  const l = useLocation();
  const th = useMantineTheme();

  const form = useForm<PartialBy<FullDictionary, "id">>({
    defaultValues: getFormDefaultValues(initialType!, u ?? userData?.UserID),
  });
  const type = useWatch<PartialBy<FullDictionary, "id">, "type">({
    name: "type",
    control: form.control,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    delete values.id as any;
    await mutateAsync({ ...values, user: u });
    nav(`../../${values.type}${l.search}`, { relative: "path" });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          <Controller<FullDictionary, "name">
            name="name"
            render={({ field, fieldState: { error } }) => (
              <TextInput
                id="name"
                label="Name"
                {...field}
                error={getErrorMessage(error)}
              />
            )}
          />
          <Controller<FullDictionary, "type">
            name="type"
            render={({ field, fieldState: { error } }) => (
              <Select
                label="Type"
                data={types}
                {...field}
                error={getErrorMessage(error)}
                allowDeselect={false}
              />
            )}
          />
          <Controller<FullDictionary, "owner">
            name="owner"
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                {...field}
                checked={value === globalDictOwner}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? globalDictOwner
                      : (u ?? userData?.UserID),
                  )
                }
                disabled={!canCreateGlobal}
                label="Globally available"
              />
            )}
          />
          <Controller<FullDictionary, "content">
            name="content"
            render={({ field, fieldState: { error } }) => (
              <Textarea
                id="content"
                label="Content"
                {...field}
                autosize
                minRows={10}
                maxRows={30}
                error={getErrorMessage(error)}
                styles={
                  type === "radius"
                    ? { input: { fontFamily: th.fontFamilyMonospace } }
                    : undefined
                }
              />
            )}
          />
          <Controls isLoading={form.formState.isSubmitting} canDelete canSave />
        </Stack>
      </form>
    </FormProvider>
  );
};

const Heading: FC = () => {
  const isNew = useIsNewDictionary();
  return <Title order={3}>{isNew ? "Add" : "Edit"} dictionary</Title>;
};

const HOC = () => {
  const isNew = useIsNewDictionary();
  return (
    <Stack gap="sm">
      <Heading />
      {isNew ? <NewDictionary /> : <DictionaryByID />}
    </Stack>
  );
};

export { HOC as DictionaryByID };
