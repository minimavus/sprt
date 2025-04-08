import { useMemo, type FC } from "react";
import {
  Box,
  Button,
  Code,
  Menu,
  rem,
  SegmentedControlItem,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { Controller, useController, useWatch } from "react-hook-form";

import { DisableableNumberInput } from "@/components/Inputs/DisableableNumberInput";
import { InputHelp } from "@/components/Inputs/InputHelp";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import { HowItWorks } from "../common/HowItWorks";
import { ListControls } from "../common/ListControls";
import { RadiusForm } from "../form";
import { useMACAddressesPatterns } from "../hooks/useMACAddressesPatterns";
import { DictionaryParameter } from "./ParametersBlock/DictionaryParameter";

const MACAddressesVariants: SegmentedControlItem[] = [
  { value: "random", label: "Random" },
  { value: "pattern", label: "Pattern" },
  { value: "list", label: "List" },
  { value: "range", label: "Range" },
  { value: "dictionary", label: "Dictionary" },
];

const MACsVariantRandom: FC = () => {
  return (
    <Box pl="md">
      <HowItWorks>
        Random MAC address will be generated for each session
      </HowItWorks>
    </Box>
  );
};

const ExamplesMenu: FC<{ onChange: (value: string) => void }> = ({
  onChange,
}) => {
  const patterns = useMACAddressesPatterns();
  const [isMenuOpen, { open, close }] = useDisclosure();

  return (
    <Menu onOpen={() => open()} onClose={() => close()}>
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
            />
          }
        >
          Examples
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {patterns.map((pattern, idx) =>
          pattern.value === "" ? (
            <Menu.Divider key={idx} />
          ) : (
            <Menu.Item
              key={pattern.value}
              onClick={() => onChange(pattern.value)}
            >
              {pattern.label}
            </Menu.Item>
          ),
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

const MACsVariantPattern: FC = () => {
  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        MAC address will be generated based on the pattern provided
      </HowItWorks>
      <Controller<RadiusForm, "macAddresses.pattern">
        name="macAddresses.pattern"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Pattern"
            error={getErrorMessage(error)}
            id="mac-address-pattern"
            rightSectionWidth={rem(106)}
            rightSection={<ExamplesMenu onChange={field.onChange} />}
          />
        )}
      />
      <Code block>
        {`The following regular expression elements are supported:
  \\w    Alphanumeric + "_"
  \\d    Digits
  \\W    Printable characters other than those in \\w
  \\D    Printable characters other than those in \\d
  .     Printable characters
  []    Character classes
  {}    Repetition
  *     Same as {0,}
  ?     Same as {0,1}
  +     Same as {1,}`}
      </Code>
    </Stack>
  );
};

const MACsVariantList: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController<RadiusForm, "macAddresses.list">({
    name: "macAddresses.list",
  });

  const linesCount = useMemo(
    () => field.value?.split("\n").filter(Boolean).length ?? 0,
    [field.value],
  );

  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        MAC address will be selected from the list provided
      </HowItWorks>
      <Textarea
        {...field}
        label={
          <>
            List of MAC addresses
            <InputHelp help="One per line. No format requirements. Everything will be used as is." />
          </>
        }
        description={`Count: ${linesCount}`}
        error={getErrorMessage(error)}
        id="mac-address-list"
        rightSectionWidth="var(--mantine-spacing-sm)"
        rightSection={
          <ListControls
            onChange={(v) => {
              field.onChange(v);
              field.onBlur();
            }}
            bulkDataSelector={(v) => {
              return v?.mac || null;
            }}
          />
        }
        styles={{
          section: {
            alignItems: "flex-end",
            justifyContent: "flex-end",
          },
        }}
        autosize
        minRows={10}
        maxRows={30}
        className={styles.compact}
        autoComplete="off"
      />
      <Controller<RadiusForm, "macAddresses.select">
        name="macAddresses.select"
        defaultValue="random"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value === "random"}
            onChange={(e) =>
              onChange(e.target.checked ? "random" : "sequential")
            }
            id="mac-address-random"
            label="Randomize MAC addresses from the list"
          />
        )}
      />
    </Stack>
  );
};

const MACsVariantRange: FC = () => {
  const randomized = useWatch<RadiusForm, "macAddresses.random">({
    name: "macAddresses.random",
  });

  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        MAC address will be generated sequentially from the range provided
      </HowItWorks>
      <SimpleGrid cols={2} spacing="sm">
        <Controller<RadiusForm, "macAddresses.start">
          name="macAddresses.start"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label="Start"
              error={getErrorMessage(error)}
              id="mac-address-start"
            />
          )}
        />
        <Controller<RadiusForm, "macAddresses.end">
          name="macAddresses.end"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label="End"
              error={getErrorMessage(error)}
              id="mac-address-end"
            />
          )}
        />
      </SimpleGrid>
      <Controller<RadiusForm, "macAddresses.step">
        name="macAddresses.step"
        defaultValue={1}
        render={({ field, fieldState: { error } }) => (
          <DisableableNumberInput
            {...field}
            label="Step"
            error={getErrorMessage(error)}
            id="mac-address-step"
            disabled={randomized}
            readOnly={randomized}
            disabledValue="Random"
          />
        )}
      />
      <Controller<RadiusForm, "macAddresses.random">
        name="macAddresses.random"
        defaultValue={false}
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="mac-address-random"
            label="Randomize MAC addresses within the range"
          />
        )}
      />
      <Code block>
        {`Supported formats:
  AA:BB:CC:DD:EE:FF
  AA-BB-CC-DD-EE-FF
  AAAA.BBBB.CCCC
  AABBCCDDEEFF`}
      </Code>
    </Stack>
  );
};

const MACsVariantDictionary: FC = () => {
  return (
    <DictionaryParameter
      name="macAddresses"
      types={["mac", "unclassified"]}
      withAllowRepeats
      withSelect
      pl="md"
      howItWorks="MAC address will be selected from the selected dictionaries"
    />
  );
};

const getMACsVariantComponent = (variant: string): FC => {
  switch (variant) {
    case "random":
      return MACsVariantRandom;
    case "pattern":
      return MACsVariantPattern;
    case "list":
      return MACsVariantList;
    case "range":
      return MACsVariantRange;
    case "dictionary":
      return MACsVariantDictionary;
    default:
      return () => null;
  }
};

export const MACAddressesParameters: FC = () => {
  const variant = useWatch<RadiusForm, "macAddresses.how">({
    name: "macAddresses.how",
  });

  const MACsVariantComponent = getMACsVariantComponent(variant);

  return (
    <>
      <Controller<RadiusForm, "macAddresses.how">
        name="macAddresses.how"
        render={({ field: { onChange, ...field } }) => (
          <LabeledSegmentedControl
            {...field}
            onChange={onChange}
            data={MACAddressesVariants}
            label="MAC address generation rule"
            clearRelatedErrors="macAddresses"
          />
        )}
      />
      <MACsVariantComponent />
      <Controller<RadiusForm, "macAddresses.allowRepeats">
        name="macAddresses.allowRepeats"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="allow-repeats"
            label="Allow reuse of MAC addresses"
          />
        )}
      />
    </>
  );
};
