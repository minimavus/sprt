import { FC } from "react";
import { useObserve } from "@legendapp/state/react";
import { Group, SimpleGrid, Stack, Title } from "@mantine/core";
import { useFieldArray } from "react-hook-form";

import type {
  BasicRadiusAttributeForm,
  FieldWithId,
  RadiusAttributeLocation,
  RadiusForm,
  VendorSpecificRadiusAttributeForm,
} from "../../form";
import { radiusParamsStore$ } from "../../store";
import { AddAttribute } from "./AddAttribute";
import { AttributeEdit } from "./AttributeEdit";
import { VendorSpecific } from "./VendorSpecific";

// const SpecificEditsMap: Record<
//   StringWithKnownValues<"default">,
//   FC<AttributeEditProps>
// > = {
//   "NAS-IP-Address": AttributeEdit,
//   "Framed-MTU": AttributeEdit,
//   "NAS-Port-Type": AttributeEdit,
//   default: AttributeEdit,
// };

const AttributesLocation: FC<{
  loc: RadiusAttributeLocation;
}> = ({ loc }) => {
  const { fields, append, remove, replace } = useFieldArray<
    RadiusForm,
    `radius.attributes.${typeof loc}`
  >({
    name: `radius.attributes.${loc}`,
  });

  useObserve(() => {
    const proto = radiusParamsStore$.radius.protoSpecific[loc].formValues.get();
    if (!proto || proto.length === 0) {
      return;
    }
    replace(proto);
  });

  return (
    <Stack gap="sm">
      <Title order={4}>
        {loc === "accessRequest" ? "Access-Request" : "Accounting-Start"}
      </Title>
      {fields.map((field, index) => {
        if (field.name === "Vendor-Specific") {
          return (
            <VendorSpecific
              key={field.id}
              field={field as FieldWithId<VendorSpecificRadiusAttributeForm>}
              idx={index}
              loc={loc}
              onRemove={() => remove(index)}
            />
          );
        }

        // const El = SpecificEditsMap[field.name] ?? SpecificEditsMap.default;
        return (
          <AttributeEdit
            key={field.id}
            field={field as FieldWithId<BasicRadiusAttributeForm>}
            idx={index}
            loc={loc}
            onRemove={() => remove(index)}
          />
        );
      })}
      <AddAttribute append={append} />
    </Stack>
  );
};

export const RadiusAttributes: FC = () => {
  return (
    <Stack gap="sm">
      <Group mt="lg">
        <Title order={3}>Attributes</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, "750px": 2 }} type="container" spacing="sm">
        <AttributesLocation loc="accessRequest" />
        <AttributesLocation loc="accountingStart" />
      </SimpleGrid>
    </Stack>
  );
};
