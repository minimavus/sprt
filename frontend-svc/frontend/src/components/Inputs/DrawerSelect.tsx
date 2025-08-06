import {
  Button,
  Checkbox,
  Collapse,
  type ComboboxItem,
  Divider,
  Drawer,
  type DrawerProps,
  Group,
  rem,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { type FC, type ReactNode, useEffect, useState } from "react";
import type { FieldError } from "react-hook-form";

import { SelectInput } from "./SelectInput";

const Option: FC<{
  value: Array<string>;
  onChange: (value: Array<string>) => void;
  option: DrawerSelectOption;
}> = ({ value, onChange, option }) => {
  return (
    <Checkbox
      checked={value.includes(option.value)}
      onChange={(e) => {
        if (e.target.checked) {
          if (value.includes(option.value)) return;
          onChange([...value, option.value]);
        } else {
          if (!value.includes(option.value)) return;
          onChange(value.filter((v) => v !== option.value));
        }
      }}
      label={option.label}
      styles={{
        label: {
          display: "inline-flex",
          gap: rem(8),
          alignItems: "center",
        },
      }}
    />
  );
};

const OptionsGroup: FC<
  {
    value: Array<string>;
    onChange: (value: Array<string>) => void;
  } & DrawerSelectOptionGroup
> = ({ value, onChange, label, options }) => {
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
        {label}
      </Button>
      <Collapse in={opened}>
        <Stack gap="xs" pt="sm">
          {options.length > 0 ? (
            options.map((o) => (
              <Option
                key={o.value}
                value={value}
                onChange={onChange}
                option={o}
              />
            ))
          ) : (
            <Group justify="center">
              <Text c="dimmed">No options available</Text>
            </Group>
          )}
        </Stack>
      </Collapse>
    </Stack>
  );
};

export type DrawerSelectOption = Omit<ComboboxItem, "label"> & {
  label?: ReactNode;
  value: string;
};

export type DrawerSelectOptionGroup = {
  label?: ReactNode;
  options: DrawerSelectOption[];
};

const isOptionGroup = (
  option: DrawerSelectOption | DrawerSelectOptionGroup,
): option is DrawerSelectOptionGroup => "options" in option;

type DrawerSelectProps = {
  options: DrawerSelectOption[] | DrawerSelectOptionGroup[];
  onChange: (value: Array<string>) => void;
  onBlur?: () => void;
  value: Array<string>;
  label: ReactNode;
  inputLabel?: ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  singular?: string;
  plural?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: Error | FieldError;
  multiple?: boolean;
  title?: ReactNode;
} & PartialBy<DrawerProps, "onClose" | "opened">;

export const DrawerSelect: FC<DrawerSelectProps> = ({
  options,
  onChange: onChangeProp,
  value: initialValue,
  onBlur,
  onClose: onCloseProp,
  opened: openedProp,
  singular,
  plural,
  label = "Select",
  inputLabel,
  inputRef,
  error: errorProp,
  position = "right",
  loading,
  disabled,
  multiple = true,
  title,
  ...props
}) => {
  const [isOpen, { close: closeDrawer, open: openDrawer }] = useDisclosure(
    openedProp ?? false,
  );
  const [value, setValue] = useState(initialValue ?? []);

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
    setValue([...initialValue]);
  }, [initialValue]);

  return (
    <>
      <SelectInput
        label={label}
        inputLabel={inputLabel}
        inputRef={inputRef}
        singular={singular}
        plural={plural}
        loading={loading}
        disabled={disabled}
        error={errorProp}
        selectedSize={initialValue?.length || 0}
        onSelect={openDrawer}
      />
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
            <Drawer.Title>{title ?? <>Select {plural}</>}</Drawer.Title>
            <Drawer.CloseButton />
          </Drawer.Header>
          <Drawer.Body styles={{ body: { flex: 1 } }}>
            <Stack gap="sm">
              {options.length > 0 ? (
                options.map((o, idx) =>
                  isOptionGroup(o) ? (
                    <OptionsGroup
                      key={idx}
                      value={value}
                      onChange={setValue}
                      {...o}
                    />
                  ) : (
                    <Option
                      key={o.value}
                      value={value}
                      onChange={setValue}
                      option={o}
                    />
                  ),
                )
              ) : (
                <Group justify="center">
                  <Text c="dimmed">No options available</Text>
                </Group>
              )}
            </Stack>
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
              <Button variant="primary" onClick={onOk}>
                Save
              </Button>
            </Group>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
};
