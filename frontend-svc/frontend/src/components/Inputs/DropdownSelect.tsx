import { FC } from "react";
import {
  Button,
  ComboboxData,
  ComboboxItemGroup,
  getThemeColor,
  InputLabel,
  Menu,
  MenuItemProps,
  PolymorphicComponentProps,
  SelectProps,
  Stack,
  StackProps,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";

interface DropdownSelectProps extends Omit<SelectProps, "onChange"> {
  onChange?: (value: string) => void;
  wrapperProps?: PolymorphicComponentProps<"div", StackProps>;
}

type Option = ComboboxData[number];

const isComboboxGroup = (
  item: Exclude<Option, string>,
): item is ComboboxItemGroup => "items" in item && "group" in item;

const Option: FC<
  {
    o: Option;
    onSelect: (val: string) => void;
    selected?: string | null;
  } & MenuItemProps
> = ({ o, onSelect, selected, ...props }) => {
  const theme = useMantineTheme();
  if (typeof o === "string") {
    return (
      <Menu.Item
        value={o}
        {...props}
        onClick={() => onSelect(o)}
        rightSection={
          selected === o ? (
            <IconCheck size={14} color={getThemeColor("green", theme)} />
          ) : null
        }
      >
        {o}
      </Menu.Item>
    );
  }
  if (isComboboxGroup(o)) {
    return (
      <>
        <Menu.Label>{o.group}</Menu.Label>
        {o.items.map((item) => (
          <Option o={item} onSelect={onSelect} selected={selected} {...props} />
        ))}
      </>
    );
  }
  return (
    <Menu.Item
      value={o.value}
      {...props}
      onClick={() => onSelect(o.value)}
      rightSection={
        selected === o.value ? (
          <IconCheck size={14} color={getThemeColor("green", theme)} />
        ) : null
      }
    >
      {o.label}
    </Menu.Item>
  );
};

const getOptionKey = (option: Option) =>
  typeof option === "string"
    ? option
    : isComboboxGroup(option)
      ? option.group
      : option.value;

const getOptionValue = (option: Option) =>
  typeof option === "string"
    ? option
    : isComboboxGroup(option)
      ? undefined
      : option.value;

const getOptionLabel = (option: Option) =>
  typeof option === "string"
    ? option
    : isComboboxGroup(option)
      ? option.group
      : option.label;

export const DropdownSelect: FC<DropdownSelectProps> = ({
  label,
  value,
  onChange,
  data,
  placeholder,
  wrapperProps,
  ...rest
}) => {
  const [opened, { open, close }] = useDisclosure();
  const options = data?.map((item) => (
    <Option
      key={getOptionKey(item)}
      o={item}
      selected={value}
      onSelect={(val) => {
        onChange?.(val);
      }}
    />
  ));
  const selectedOption = data?.find((item) => getOptionValue(item) === value);

  return (
    <Stack gap={0} {...wrapperProps}>
      {label ? <InputLabel>{label}</InputLabel> : null}
      <Menu onOpen={open} onClose={close}>
        <Menu.Target {...rest}>
          <Button
            variant="subtle"
            rightSection={
              <IconChevronDown
                size={14}
                style={{
                  transform: opened ? "rotate(-180deg)" : "none",
                }}
              />
            }
            size="compact-sm"
          >
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>{options}</Menu.Dropdown>
      </Menu>
    </Stack>
  );
};
