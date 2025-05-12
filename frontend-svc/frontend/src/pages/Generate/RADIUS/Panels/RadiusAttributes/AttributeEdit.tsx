import type { FC, RefAttributes } from "react";
import { use$ } from "@legendapp/state/react";
import {
  ActionIcon,
  Autocomplete,
  InputClearButton,
  rem,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useMergedRef } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconBinary, IconTrash } from "@tabler/icons-react";
import Hex from "hex-encoding";
import { Base64 } from "js-base64";
import { ok } from "neverthrow";
import { useController } from "react-hook-form";

import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import { RadiusDictionaryAttributeType } from "@/hooks/generate/useRadiusDictionaries";
import { useQueryUser } from "@/hooks/useQueryUser";
import styles from "@/styles/TextInput.module.scss";
import { getErrorMessage } from "@/utils/errors";

import { useIsVisible } from "../../common/visibilityContext";
import type {
  BasicRadiusAttributeForm,
  FieldWithId,
  RadiusAttributeLocation,
  RadiusForm,
} from "../../form";
import { useNadFamily } from "../../hooks/useNadFamily";
import { radiusParamsStore$ } from "../../store";
import { attrTypeToString } from "./formatters";
import { HexEditModal } from "./HexEditModal";
import { useValuesContext, ValuesProvider } from "./valuesContext";

type Paths =
  | `radius.attributes.${RadiusAttributeLocation}.${number}.value`
  | `radius.attributes.${RadiusAttributeLocation}.${number}.value.${number}.value`;

type B64FlagPaths =
  | `radius.attributes.${RadiusAttributeLocation}.${number}.base64`
  | `radius.attributes.${RadiusAttributeLocation}.${number}.value.${number}.base64`;

export type AttributeEditProps = {
  fieldPath?: Paths;
  field: FieldWithId<BasicRadiusAttributeForm>;
  onRemove: () => void;
  idx: number;
  loc: RadiusAttributeLocation;
};

const trimmedBase64ValueAsHex = (value: string) => {
  try {
    const decoded = Base64.toUint8Array(value);
    const hex = Hex.encode(decoded);
    return hex.length > 32 ? `${hex.slice(0, 32)}…` : hex;
  } catch (_) {
    return value;
  }
};

const AttributeEdit: FC<
  AttributeEditProps & RefAttributes<HTMLInputElement>
> = ({
  field: fieldData,
  onRemove,
  idx,
  loc,
  fieldPath: fieldPathFromProps,
  ref: forwardedRef,
}) => {
  const [u] = useQueryUser();
  const family = useNadFamily(u);

  const specific = use$(() =>
    radiusParamsStore$.radius.protoSpecific[loc].byName[fieldData.name].get(),
  );
  const meta = use$(() =>
    radiusParamsStore$.radius
      .byName({ attr: fieldData.name, vendor: fieldData.vendor })
      .get(),
  );

  const fieldPath =
    fieldPathFromProps ?? `radius.attributes.${loc}.${idx}.value`;
  const base64FlagPath = fieldPath.replace(
    /\.value$/,
    ".base64",
  ) as B64FlagPaths;

  const {
    field: { ref, value, ...field },
    fieldState,
  } = useController<RadiusForm, typeof fieldPath>({
    name: fieldPath,
  });

  const mergedRef = useMergedRef(ref, forwardedRef);

  const readOnly =
    (specific?.non_removable || !(specific?.overwrite ?? true)) &&
    !fieldData.custom;

  const confirm = useDynamicConfirmation();
  const valuesContext = useValuesContext();
  const values = use$(() =>
    valuesContext.filteredValues
      .get()
      ?.filter((v) => (v.loc ? v.loc === loc : true))
      .map((v) => v.value),
  );

  const isOctets = meta?.Type === RadiusDictionaryAttributeType.AttributeOctets;
  let withClearButton = false;

  const {
    field: { value: base64Flag, onChange: onBase64FlagChange },
  } = useController<RadiusForm, typeof base64FlagPath>({
    name: base64FlagPath,
    disabled: !isOctets || readOnly,
    defaultValue: undefined,
  });

  let icons = 1;
  if (isOctets) {
    icons++;
    if (value && !values?.includes(value as string)) {
      icons++;
      withClearButton = true;
    }
  }

  const theme = useMantineTheme();
  const rightSectionWidth = `calc(${rem(`${28 * icons} + 8`)})`;
  const isVisible = useIsVisible();

  if (
    (specific?.family_specific && family !== specific.family_specific) ||
    !isVisible
  ) {
    return null;
  }

  return (
    <Autocomplete
      ref={mergedRef}
      id={fieldPath}
      label={fieldData.name}
      description={`${attrTypeToString(meta?.Type)}${isOctets && meta.Size.Valid ? ` [${meta.Size.Int}]` : ""}`}
      error={getErrorMessage(fieldState.error)}
      readOnly={readOnly || (isOctets ? base64Flag : false)}
      key={fieldData.name}
      className={styles.compact}
      rightSectionWidth={rightSectionWidth}
      rightSection={
        specific?.non_removable && !fieldData.custom ? null : (
          <>
            {withClearButton ? (
              <InputClearButton
                onClick={() => {
                  field.onChange("");
                  onBase64FlagChange(undefined);
                }}
              />
            ) : null}
            <ActionIcon.Group>
              {isOctets ? (
                <Tooltip withArrow label="Edit octets">
                  <ActionIcon
                    aria-label="Edit octets"
                    variant="subtle"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      const id = modals.open({
                        title: "Edit octets",
                        size: "lg",
                        children: (
                          <HexEditModal
                            cancel={() => modals.close(id)}
                            save={(v) => {
                              field.onChange(Base64.fromUint8Array(v));
                              onBase64FlagChange(true);
                              modals.close(id);
                            }}
                            data={
                              base64Flag
                                ? Base64.toUint8Array(value as string)
                                : undefined
                            }
                            definitionSize={
                              meta?.Size?.Valid ? meta.Size.Int : undefined
                            }
                          />
                        ),
                      });
                    }}
                    title="Edit octets"
                  >
                    <IconBinary size={18} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
              <Tooltip withArrow label="Remove attribute">
                <ActionIcon
                  aria-label="Delete"
                  variant="subtle"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    confirm({
                      title: "Delete attribute",
                      children:
                        "Are you sure you want to delete this attribute?",
                      onConfirm: async () => {
                        onRemove();
                        return ok(undefined);
                      },
                      confirmText: "Delete",
                      destructive: true,
                    });
                  }}
                  title="Remove attribute"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </ActionIcon.Group>
          </>
        )
      }
      data={readOnly ? undefined : values}
      {...field}
      value={
        base64Flag
          ? trimmedBase64ValueAsHex(value as string)
          : ((value as string) ?? "")
      }
      comboboxProps={{ shadow: "sm" }}
      leftSection={base64Flag ? <IconBinary size={18} /> : undefined}
      styles={
        base64Flag
          ? {
              input: {
                fontFamily: theme.fontFamilyMonospace,
              },
            }
          : undefined
      }
    />
  );
};

const AttributeEditHOC: FC<AttributeEditProps> = (props) => {
  return (
    <ValuesProvider attr={props.field.name} vendor={props.field.vendor}>
      <AttributeEdit {...props} />
    </ValuesProvider>
  );
};

export { AttributeEditHOC as AttributeEdit };
