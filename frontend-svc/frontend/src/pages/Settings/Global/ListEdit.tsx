import { type FC } from "react";
import {
  ActionIcon,
  Group,
  InputLabel,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { path } from "rambda";
import { useFieldArray, useFormContext, useFormState } from "react-hook-form";

export const ListEdit: FC<{
  label?: string;
  name: string;
}> = ({ label, name }) => {
  const { register, clearErrors } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name });
  const st = useFormState({ name });

  return (
    <Stack gap="xs">
      <InputLabel>{label}</InputLabel>
      <Table>
        <Table.Tbody>
          {fields.map((v, i) => (
            <Table.Tr key={v.id}>
              <Table.Td>
                <Group gap="xs">
                  <TextInput
                    {...register(`${name}.${i}`, {
                      onChange: () => {
                        if (path(`${name}.${i}`, st.errors)) {
                          clearErrors(`${name}.${i}`);
                        }
                      },
                    })}
                    flex={1}
                    error={(path(`${name}.${i}`, st.errors) as any)?.message}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => remove(i)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td colSpan={2}>
              <TextInput
                placeholder="Add new pattern: start typing..."
                value=""
                onChange={(e) => {
                  if (e.target.value.length > 0) {
                    append(e.target.value, {
                      shouldFocus: true,
                      focusName: `${name}.${fields.length}`,
                    });
                  }
                }}
              />
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Stack>
  );
};
