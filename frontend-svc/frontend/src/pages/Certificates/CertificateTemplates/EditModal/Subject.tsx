import { useState, type FC } from "react";
import {
  ActionIcon,
  Button,
  Menu,
  Stack,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { RDNOrder, SANKeysOrder } from "@/hooks/certificates/templates";
import { getErrorMessage } from "@/utils/errors";

import type { FormValues } from "./types";

const RNDPartFullNames: Record<(typeof RDNOrder)[number], string> = {
  cn: "Common Name",
  ou: "Organizational Unit",
  o: "Organization",
  l: "Locality",
  st: "State",
  c: "Country",
  dc: "Domain Component",
};

const SANFullNames: Record<(typeof SANKeysOrder)[number], string> = {
  rfc822Name: "RFC 822 Name (Email or MAC)",
  dNSName: "DNS",
  x400Address: "X.400 Address",
  directoryName: "Directory Name",
  uniformResourceIdentifier: "URI",
  iPAddress: "IP Address",
};

const RDNPartEdit: FC<{ part: (typeof RDNOrder)[number] }> = ({ part }) => {
  const { fields, remove } = useFieldArray({
    name: `content.subject.${part}`,
  });

  if (fields.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      {fields.map((field, index) => (
        <Controller<FormValues, `content.subject.${typeof part}.${number}`>
          key={field.id}
          name={`content.subject.${part}.${index}`}
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label={RNDPartFullNames[part]}
              error={getErrorMessage(error)}
              rightSection={
                <Tooltip label="Remove Part">
                  <ActionIcon onClick={() => remove(index)} variant="subtle">
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              }
            />
          )}
        />
      ))}
    </Stack>
  );
};

const SANPartEdit: FC<{ part: (typeof SANKeysOrder)[number] }> = ({ part }) => {
  const { fields, remove } = useFieldArray({
    name: `content.san.${part}`,
  });

  if (fields.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs">
      {fields.map((field, index) => (
        <Controller<FormValues, `content.san.${typeof part}.${number}`>
          key={field.id}
          name={`content.san.${part}.${index}`}
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              label={SANFullNames[part]}
              error={getErrorMessage(error)}
              rightSection={
                <Tooltip label="Remove SAN">
                  <ActionIcon onClick={() => remove(index)} variant="subtle">
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              }
            />
          )}
        />
      ))}
    </Stack>
  );
};

const SANEdit: FC = () => {
  const { setValue, getValues, setFocus } = useFormContext<FormValues>();
  const addSANPart = (part: (typeof SANKeysOrder)[number]) => {
    const current = (getValues(`content.san.${part}`) ||
      []) as unknown as string[];
    if (Array.isArray(current) && current.length > 0) {
      if (current[current.length - 1] === "") {
        setFocus(`content.san.${part}.${current.length - 1}`);
        return;
      }
    }
    setValue(`content.san.${part}`, [...current, ""]);
    setFocus(`content.san.${part}.${current.length}`);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Stack gap="xs">
      <Title order={3}>Subject Alternative Names</Title>
      {SANKeysOrder.map((part) => (
        <SANPartEdit key={part} part={part} />
      ))}
      <div>
        <Menu
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
        >
          <Menu.Target>
            <Button
              variant="subtle"
              size="compact-xs"
              rightSection={
                <IconChevronDown
                  size={14}
                  style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
                />
              }
            >
              Add SAN
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {SANKeysOrder.map((part) => (
              <Menu.Item key={part} onClick={() => addSANPart(part)}>
                {SANFullNames[part]}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
    </Stack>
  );
};

export const Subject: FC = () => {
  const { setValue, getValues, setFocus } = useFormContext<FormValues>();
  const addRDNPart = (part: (typeof RDNOrder)[number]) => {
    const current = (getValues(`content.subject.${part}`) ||
      []) as unknown as string[];
    if (Array.isArray(current) && current.length > 0) {
      if (current[current.length - 1] === "") {
        setFocus(`content.subject.${part}.${current.length - 1}`);
        return;
      }
    }
    setValue(`content.subject.${part}`, [...current, ""]);
    setFocus(`content.subject.${part}.${current.length}`);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Stack gap="xs">
      <Title order={3}>Subject</Title>
      {RDNOrder.map((part) => (
        <RDNPartEdit key={part} part={part} />
      ))}
      <div>
        <Menu
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
        >
          <Menu.Target>
            <Button
              variant="subtle"
              size="compact-xs"
              rightSection={
                <IconChevronDown
                  size={14}
                  style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
                />
              }
            >
              Add RDN Part
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {RDNOrder.map((part) => (
              <Menu.Item key={part} onClick={() => addRDNPart(part)}>
                {`${RNDPartFullNames[part]} (${part.toUpperCase()})`}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
      <SANEdit />
    </Stack>
  );
};
