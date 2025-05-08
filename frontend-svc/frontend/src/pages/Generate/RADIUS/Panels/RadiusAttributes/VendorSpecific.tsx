import { useEffect, useState, type FC } from "react";
import {
  ActionIcon,
  Card,
  Collapse,
  Group,
  InputLabel,
  rem,
  Stack,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import { ok } from "neverthrow";
import { useController, useFieldArray } from "react-hook-form";

import { useDynamicConfirmation } from "@/components/Modals/Confirmation";

import type {
  BasicRadiusAttributeForm,
  FieldWithId,
  RadiusForm,
  VendorSpecificRadiusAttributeForm,
} from "../../form";
import { AddAttribute } from "./AddAttribute";
import { AttributeEdit, type AttributeEditProps } from "./AttributeEdit";

type VendorSpecificProps = Omit<AttributeEditProps, "field"> & {
  field: FieldWithId<VendorSpecificRadiusAttributeForm>;
};

export const VendorSpecific: FC<VendorSpecificProps> = ({
  loc,
  idx,
  onRemove,
}) => {
  const [open, setOpen] = useState(true);

  const { append, fields, remove } = useFieldArray<
    RadiusForm,
    `radius.attributes.${typeof loc}.${number}.value`
  >({
    name: `radius.attributes.${loc}.${idx}.value`,
  });

  const { field: vendorController } = useController<
    RadiusForm,
    `radius.attributes.${typeof loc}.${number}.vendor`
  >({
    name: `radius.attributes.${loc}.${idx}.vendor`,
  });

  useEffect(() => {
    if (fields.length === 0) {
      vendorController.onChange(undefined);
    }
  }, [fields.length]);

  const confirm = useDynamicConfirmation();

  return (
    <Card
      shadow="none"
      ps="calc(calc(2.25rem* var(--mantine-scale)) / 3)"
      pe={rem(3)}
      pt={rem(3)}
      pb={rem(3)}
      withBorder
      radius="sm"
    >
      <Stack gap="xs">
        <Group gap="xs" justify="space-between">
          <Group
            gap="xs"
            style={{ cursor: "pointer" }}
            onClick={() => setOpen((c) => !c)}
          >
            <InputLabel>
              Vendor-Specific
              {vendorController.value ? ` (${vendorController.value})` : ""}
            </InputLabel>
            <IconChevronDown
              size={18}
              style={{ transform: open ? "rotate(-180deg)" : "none" }}
            />
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation();
              confirm({
                title: "Delete attribute",
                children: "Are you sure you want to delete this attribute?",
                onConfirm: async () => {
                  onRemove();
                  return ok(undefined);
                },
                confirmText: "Delete",
                destructive: true,
              });
            }}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
        <Collapse in={open}>
          <Stack gap="sm">
            {fields.length === 0 ? (
              <Text>No vendor-specific attributes yet</Text>
            ) : (
              (fields as (BasicRadiusAttributeForm & { id: string })[]).map(
                (field, index) => (
                  <AttributeEdit
                    key={field.id}
                    field={field}
                    idx={index}
                    loc={loc}
                    onRemove={() => remove(index)}
                    fieldPath={`radius.attributes.${loc}.${idx}.value.${index}.value`}
                  />
                ),
              )
            )}
            <AddAttribute
              append={(v) => {
                if (Array.isArray(v)) {
                  return;
                }
                if (!vendorController.value) {
                  vendorController.onChange(v.vendor);
                }

                append(v as any);
              }}
              label="Add to VSA"
              vsa
              vendor={vendorController.value || undefined}
            />
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
};
