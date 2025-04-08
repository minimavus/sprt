import { useEffect, useState, type FC, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  DrawerProps,
  Group,
  InputError,
  noop,
  rem,
  Space,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { FieldError } from "react-hook-form";

import { EmptyState } from "@/components/EmptyState";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { SkeletonLines } from "@/components/Skeleton";
import {
  useDictionariesOfType,
  useDictionaryTypes,
} from "@/hooks/settings/dictionaries";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";

import styles from "./DrawerSelect.module.scss";

export type KnownDictionaryType = StringWithKnownValues<
  "ua" | "credentials" | "form" | "mac" | "ip" | "unclassified"
>;

const DictionariesOfType: FC<{
  type: KnownDictionaryType;
  value: Array<string>;
  onChange: (value: Array<string>) => void;
  header: ReactNode;
}> = ({ type, value, onChange, header }) => {
  const [u] = useQueryUser();
  const {
    data: dictionaries,
    isLoading,
    error,
  } = useDictionariesOfType(type, true, u);
  const [opened, { toggle }] = useDisclosure(true);

  return (
    <Stack flex={1} gap={0}>
      <Divider />
      <Button
        fullWidth
        onClick={toggle}
        variant="subtle"
        justify="space-between"
        size="compact-sm"
        rightSection={
          <IconChevronDown
            size={14}
            style={{ transform: opened ? "rotate(-180deg)" : "none" }}
          />
        }
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        {header}
      </Button>
      <Collapse in={opened}>
        <Stack gap="xs" pt="sm">
          {isLoading ? (
            <SkeletonLines height="sm" x={5} mb={0} />
          ) : error ? (
            <DisplayError error={error} />
          ) : dictionaries?.length ? (
            dictionaries?.map((dict) => (
              <Checkbox
                key={dict.id}
                checked={value.includes(dict.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (value.includes(dict.id)) return;
                    onChange([...value, dict.id]);
                  } else {
                    if (!value.includes(dict.id)) return;
                    onChange(value.filter((v) => v !== dict.id));
                  }
                }}
                label={dict.name}
              />
            ))
          ) : (
            <Group justify="center">
              <Text c="dimmed">
                There are no dictionaries available for this type
              </Text>
            </Group>
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const LoadingDictionaries: FC = () => {
  return <DefaultLoaderFallback />;
};

type DictionarySelectProps = {
  types: KnownDictionaryType[];
  onChange: (value: Array<string>) => void;
  value: Array<string>;
  onBlur?: () => void;

  randomized?: boolean;
  onRandomizedChange?: (value: boolean) => void;

  allowReuse?: boolean;
  onAllowReuseChange?: (value: boolean) => void;

  inputLabel?: ReactNode;
  error?: Error | FieldError;
  disabled?: boolean;
  loading?: boolean;
} & PartialBy<DrawerProps, "onClose" | "opened">;

export const DictionarySelect: FC<DictionarySelectProps> = ({
  types,
  onChange: onChangeProp,
  value: initialValue,
  onBlur,
  randomized,
  onRandomizedChange,
  allowReuse,
  onAllowReuseChange,
  onClose: onCloseProp,
  opened: isOpenProp,
  error: errorProp,
  position = "right",
  inputLabel,
  disabled,
  loading,
  ...props
}) => {
  const [isOpen, { close: closeDrawer, open: openDrawer }] = useDisclosure(
    isOpenProp ?? false,
  );
  const [value, setValue] = useState(initialValue ?? []);

  const { data: typesMap, isLoading, isError, error } = useDictionaryTypes();

  const close: typeof onCloseProp = () => {
    closeDrawer();
    onBlur?.();
    onCloseProp?.();
  };

  const onOk: typeof onCloseProp = () => {
    onChangeProp(value);
    close();
  };

  useEffect(() => {
    setValue([...(initialValue ?? [])]);
  }, [initialValue]);

  return (
    <>
      <Stack gap={0}>
        <Group
          align="flex-end"
          gap={0}
          className={styles["drawer-select-root"]}
        >
          <TextInput
            flex={1}
            value={
              initialValue?.length > 0
                ? `${initialValue.length} ${initialValue.length === 1 ? "dictionary" : "dictionaries"} selected`
                : loading
                  ? "Something is loading..."
                  : "No dictionaries selected"
            }
            onChange={noop}
            readOnly
            styles={{
              input: {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            }}
            label={inputLabel}
            disabled={disabled}
          />
          <Button
            variant="default"
            onClick={openDrawer}
            className={styles["select-button"]}
            disabled={disabled}
            loading={loading}
          >
            Select
          </Button>
        </Group>
        {errorProp ? (
          <InputError mt="calc(var(--mantine-spacing-xs) / 2)">
            {errorProp.message}
          </InputError>
        ) : null}
      </Stack>
      <Drawer.Root
        opened={isOpen}
        onClose={close}
        position={position}
        offset={rem(8)}
        radius="md"
        {...props}
      >
        <Drawer.Overlay />
        <Drawer.Content
          styles={{ content: { display: "flex", flexDirection: "column" } }}
        >
          <Drawer.Header>
            <Drawer.Title>Select dictionaries</Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>
          <Drawer.Body styles={{ body: { flex: 1 } }}>
            {isLoading ? (
              <LoadingDictionaries />
            ) : isError ? (
              <EmptyState
                variant="negative"
                title="Failed to load dictionaries"
                message={getErrorMessage(error)}
              />
            ) : (
              <Stack gap="sm">
                {types.map((type) => (
                  <DictionariesOfType
                    key={type}
                    type={type}
                    value={value}
                    onChange={setValue}
                    header={typesMap?.find((t) => t.name === type)?.title}
                  />
                ))}
                {onRandomizedChange || onAllowReuseChange ? <Space /> : null}
                {onRandomizedChange ? (
                  <Switch
                    onChange={(e) => onRandomizedChange(e.target.checked)}
                    checked={randomized}
                    id="randomize-dictionaries"
                    label="Randomize values within the dictionaries"
                  />
                ) : null}
                {onAllowReuseChange ? (
                  <Switch
                    onChange={(e) => onAllowReuseChange(e.target.checked)}
                    checked={allowReuse}
                    id="allow-reuse-dictionaries"
                    label="Allow reuse of values within the dictionaries"
                  />
                ) : null}
              </Stack>
            )}
            <Group
              justify="end"
              gap="md"
              mt="md"
              pos="sticky"
              bottom={0}
              bg="var(--mantine-color-body)"
              mb={rem(-16)}
              pb={rem(16)}
              pt={rem(16)}
            >
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onOk}
                loading={isLoading}
                disabled={value.length === 0}
              >
                Save
              </Button>
            </Group>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
};
