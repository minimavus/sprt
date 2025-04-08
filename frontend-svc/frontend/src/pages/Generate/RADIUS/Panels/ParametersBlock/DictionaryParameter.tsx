import {
  useEffect,
  useMemo,
  type ComponentProps,
  type FC,
  type ReactNode,
} from "react";
import { Stack, StackProps } from "@mantine/core";
import { useController } from "react-hook-form";

import { DictionarySelect } from "@/components/Inputs/DictionarySelect";
import { SelectFromDictionary } from "@/hooks/generate/schemas";
import {
  useDictionariesOfType,
  useDictionaryByName,
} from "@/hooks/settings/dictionaries";
import { useQueryUser } from "@/hooks/useQueryUser";

import { HowItWorks } from "../../common/HowItWorks";
import { withPrefix } from "./utils";

interface DictionaryParameterProps extends StackProps {
  name: string;
  types: ComponentProps<typeof DictionarySelect>["types"];
  label?: ComponentProps<typeof DictionarySelect>["inputLabel"];
  withAllowRepeats?: boolean;
  allowRepeats?: boolean;
  withSelect?: boolean;
  select?: SelectFromDictionary;
  howItWorks?: ReactNode;
  disabled?: boolean;
  value?: string[] | string;
}

const extractType = (value: string): string => {
  if (value.startsWith("allByType:")) {
    return value.slice(10);
  }
  return "";
};

const extractName = (value: string): string => {
  if (value.startsWith("byName:")) {
    return value.slice(7);
  }
  return "";
};

const useLoadableDictionaries = (value: string[] | string | undefined) => {
  const [user] = useQueryUser();
  const isString = typeof value === "string";
  const type = isString ? extractType(value) : "";
  const name = isString ? extractName(value) : "";
  const {
    data: ofTypeData,
    isLoading: ofTypeLoading,
    error: ofTypeError,
    status: ofTypeStatus,
  } = useDictionariesOfType(type, true, user);

  const {
    data: ofNameData,
    isLoading: onNameLoading,
    error: onNameError,
    status: onNameStatus,
  } = useDictionaryByName(name, user);

  return useMemo(
    () => ({
      data: isString
        ? type
          ? ofTypeData?.map((d) => d.id)
          : ofNameData?.id
            ? [ofNameData.id]
            : undefined
        : value,
      isLoading: isString ? (type ? ofTypeLoading : onNameLoading) : false,
      error: isString ? (type ? ofTypeError : onNameError) : undefined,
      status: isString ? (type ? ofTypeStatus : onNameStatus) : "success",
    }),
    [
      value,
      ofTypeData,
      ofTypeLoading,
      ofTypeError,
      ofTypeStatus,
      ofNameData,
      onNameLoading,
      onNameError,
      onNameStatus,
    ],
  );
};

export const DictionaryParameter: FC<DictionaryParameterProps> = ({
  name,
  withAllowRepeats = false,
  withSelect = false,
  howItWorks,
  types,
  pl,
  gap = "sm",
  disabled,
  value: initialValue,
  label,
  allowRepeats: defaultAllowRepeats,
  select: defaultSelect,
  ...props
}) => {
  const { field: dictionaries, fieldState: dictionariesFieldState } =
    useController({
      name: withPrefix(name, "dictionaries"),
    });
  const { field: allowRepeats } = useController({
    disabled: !withAllowRepeats,
    name: withPrefix(name, "allowRepeats"),
    defaultValue: defaultAllowRepeats,
  });
  const { field: select } = useController({
    disabled: !withSelect,
    name: withPrefix(name, "select"),
    defaultValue: defaultSelect,
  });
  const { data, isLoading, error } = useLoadableDictionaries(initialValue);
  useEffect(() => {
    if (!data) {
      return;
    }
    dictionaries.onChange(data);
  }, [data]);

  return (
    <Stack pl={pl} gap={gap} {...props}>
      {howItWorks ? <HowItWorks>{howItWorks}</HowItWorks> : null}
      <DictionarySelect
        types={types}
        value={dictionaries.value}
        onChange={dictionaries.onChange}
        loading={isLoading}
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
        error={error || dictionariesFieldState.error}
        disabled={disabled}
        inputLabel={label}
      />
    </Stack>
  );
};
