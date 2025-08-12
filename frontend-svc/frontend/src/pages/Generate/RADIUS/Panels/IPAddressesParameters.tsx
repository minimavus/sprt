import {
  Button,
  Menu,
  rem,
  type SegmentedControlItem,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { type FC, useMemo } from "react";
import { Controller, useController, useWatch } from "react-hook-form";

import { DictionarySelect } from "@/components/Inputs/DictionarySelect";
import { DisableableNumberInput } from "@/components/Inputs/DisableableNumberInput";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage, maybeError } from "@/utils/errors";

import { HowItWorks } from "../common/HowItWorks";
import { ListControls } from "../common/ListControls";
import type { RadiusForm } from "../form";
import { useIPAddressesRanges } from "../hooks/useIPAddressesRanges";

const IPAddressesVariants: SegmentedControlItem[] = [
  { value: "random", label: "Random" },
  { value: "list", label: "List" },
  { value: "range", label: "Range" },
  { value: "dictionary", label: "Dictionary" },
];

const IPsVariantRandom: FC = () => {
  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        Random IP address will be generated for each session
      </HowItWorks>
    </Stack>
  );
};

const IPsVariantList: FC = () => {
  const {
    field: ipAddresses,
    fieldState: { error: ipAddressesError },
  } = useController<RadiusForm, "ipAddresses.list">({
    name: "ipAddresses.list",
  });

  const linesCount = useMemo(
    () => ipAddresses.value?.split("\n").filter(Boolean).length ?? 0,
    [ipAddresses.value],
  );

  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        IP addresses will be selected from the provided list
      </HowItWorks>
      <Textarea
        {...ipAddresses}
        label="List of IP addresses"
        description={`Count: ${linesCount}`}
        error={maybeError(ipAddressesError)}
        id="ip-addresses-list"
        rightSectionWidth="var(--mantine-spacing-sm)"
        rightSection={
          <ListControls
            onChange={(v) => {
              ipAddresses.onChange(v);
              ipAddresses.onBlur();
            }}
            bulkDataSelector={(v) => {
              return v?.ipAddr || null;
            }}
          />
        }
        className={styles.compact}
        styles={{
          section: {
            alignItems: "flex-end",
            justifyContent: "flex-end",
          },
        }}
        autosize
        minRows={10}
        maxRows={30}
        autoComplete="off"
      />
      <Controller<RadiusForm, "ipAddresses.select">
        name="ipAddresses.select"
        defaultValue="random"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value === "random"}
            onChange={(e) =>
              onChange(e.target.checked ? "random" : "sequential")
            }
            id="ip-address-random"
            label="Randomize IP addresses from the list"
          />
        )}
      />
    </Stack>
  );
};

const ExamplesMenu: FC<{ onChange: (value: string) => void }> = ({
  onChange,
}) => {
  const ranges = useIPAddressesRanges();
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
        {ranges.map((range, idx) =>
          range.value === "" ? (
            <Menu.Divider key={idx} />
          ) : (
            <Menu.Item key={range.value} onClick={() => onChange(range.value)}>
              {range.label}
            </Menu.Item>
          ),
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

const IPsVariantRange: FC = () => {
  const random = useWatch<RadiusForm, "ipAddresses.random">({
    name: "ipAddresses.random",
  });

  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        IP addresses will be selected from the range provided
      </HowItWorks>
      <Controller<RadiusForm, "ipAddresses.range">
        name="ipAddresses.range"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            label="Range"
            error={getErrorMessage(error)}
            id="ip-addresses-range"
            rightSectionWidth={rem(106)}
            rightSection={<ExamplesMenu onChange={field.onChange} />}
          />
        )}
      />
      <Controller<RadiusForm, "ipAddresses.step">
        name="ipAddresses.step"
        defaultValue={1}
        render={({ field, fieldState: { error } }) => (
          <DisableableNumberInput
            {...field}
            label="Step"
            error={getErrorMessage(error)}
            id="ip-addresses-step"
            disabled={random}
            readOnly={random}
            disabledValue="Random"
          />
        )}
      />
      <Controller<RadiusForm, "ipAddresses.random">
        name="ipAddresses.random"
        defaultValue={false}
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="ip-addresses-random"
            label="Randomize IP addresses within the range"
          />
        )}
      />
    </Stack>
  );
};

const IPsVariantDictionary: FC = () => {
  const { field: dictionaries, fieldState: dictionariesFieldState } =
    useController<RadiusForm, "ipAddresses.dictionaries">({
      name: "ipAddresses.dictionaries",
    });
  const { field: allowRepeats } = useController<
    RadiusForm,
    "ipAddresses.allowRepeats"
  >({
    name: "ipAddresses.allowRepeats",
  });
  const { field: select } = useController<RadiusForm, "ipAddresses.select">({
    name: "ipAddresses.select",
  });

  return (
    <Stack pl="md" gap="sm">
      <HowItWorks>
        IP addresses will be selected from the selected dictionaries
      </HowItWorks>
      <DictionarySelect
        types={["ip", "unclassified"]}
        value={dictionaries.value}
        onChange={dictionaries.onChange}
        onBlur={() => {
          dictionaries.onBlur();
          allowRepeats.onBlur();
          select.onBlur();
        }}
        randomized={select.value === "random"}
        onRandomizedChange={(randomized) =>
          select.onChange(randomized ? "random" : "sequential")
        }
        allowReuse={allowRepeats.value}
        onAllowReuseChange={allowRepeats.onChange}
        error={dictionariesFieldState.error}
      />
    </Stack>
  );
};

const getIPsVariantComponent = (variant: string): FC => {
  switch (variant) {
    case "random":
      return IPsVariantRandom;
    case "list":
      return IPsVariantList;
    case "range":
      return IPsVariantRange;
    case "dictionary":
      return IPsVariantDictionary;
    default:
      return () => null;
  }
};

export const IPAddressesParameters: FC = () => {
  const variant = useWatch<RadiusForm, "ipAddresses.how">({
    name: "ipAddresses.how",
  });

  const IPsVariantComponent = getIPsVariantComponent(variant);

  return (
    <>
      <Controller<RadiusForm, "ipAddresses.how">
        name="ipAddresses.how"
        render={({ field: { onChange, ...field } }) => (
          <LabeledSegmentedControl
            {...field}
            onChange={(value) => onChange(value)}
            data={IPAddressesVariants}
            label="IP address generation rule"
            clearRelatedErrors="ipAddresses"
          />
        )}
      />
      <IPsVariantComponent />
      <Controller<RadiusForm, "ipAddresses.allowRepeats">
        name="ipAddresses.allowRepeats"
        render={({ field: { value, onChange, ...field } }) => (
          <Switch
            {...field}
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            id="ip-addresses-allow-repeats"
            label="Allow reuse of IP addresses"
          />
        )}
      />
    </>
  );
};
