import { FC } from "react";
import { ActionIcon, Button, Stack, TextInput, Tooltip } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import cx from "classnames";
import { Controller, useFieldArray } from "react-hook-form";

import { getErrorMessage } from "@/utils/errors";

import { NewConnectionFields } from "./form";
import styles from "./NewConnection.module.scss";

export const GeneralConfig: FC = () => {
  const { fields, append, remove } = useFieldArray<
    NewConnectionFields,
    "nodes"
  >({
    name: "nodes",
  });

  return (
    <Stack gap="sm">
      <Controller<NewConnectionFields, "friendlyName">
        name="friendlyName"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="Friendly name"
            required
          />
        )}
      />
      <Controller<NewConnectionFields, "clientName">
        name="clientName"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="Client name (will be displayed on ISE)"
            required
          />
        )}
      />
      <Controller<NewConnectionFields, "description">
        name="description"
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            error={getErrorMessage(error)}
            label="Description (will be displayed on ISE)"
          />
        )}
      />

      <div className={styles.address_with_port}>
        <Controller<NewConnectionFields, "dns.ip">
          name="dns.ip"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              error={getErrorMessage(error)}
              label="DNS server (IP address)"
            />
          )}
        />
        <Controller<NewConnectionFields, "dns.port">
          name="dns.port"
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              error={getErrorMessage(error)}
              label="Port (UDP)"
              type="number"
            />
          )}
        />
      </div>

      {fields.map((node, index) => (
        <div
          key={node.id}
          className={cx(styles.address_with_port, {
            [styles.action]: index > 0,
          })}
        >
          <Controller<NewConnectionFields, `nodes.${typeof index}.fqdn`>
            name={`nodes.${index}.fqdn`}
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                error={getErrorMessage(error)}
                label={`FQDN of a ${
                  index === 0 ? "Primary" : "Secondary"
                } pxGrid node`}
                required={index === 0}
              />
            )}
          />

          {index > 0 ? (
            <div className={styles.action}>
              <Controller<
                NewConnectionFields,
                `nodes.${typeof index}.controlPort`
              >
                name={`nodes.${index}.controlPort`}
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    {...field}
                    error={getErrorMessage(error)}
                    label="Control port (TCP)"
                  />
                )}
              />
              <Tooltip label="Remove node">
                <ActionIcon onClick={() => remove(index)} variant="subtle">
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </div>
          ) : (
            <Controller<
              NewConnectionFields,
              `nodes.${typeof index}.controlPort`
            >
              name={`nodes.${index}.controlPort`}
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  error={getErrorMessage(error)}
                  label="Control port (TCP)"
                />
              )}
            />
          )}
        </div>
      ))}
      {fields.length < 4 ? (
        <div>
          <Button
            type="button"
            onClick={() =>
              append({
                fqdn: "",
                controlPort: 8910,
              })
            }
            variant="subtle"
            leftSection={<IconPlus size={16} />}
          >
            Add node
          </Button>
        </div>
      ) : null}
    </Stack>
  );
};
