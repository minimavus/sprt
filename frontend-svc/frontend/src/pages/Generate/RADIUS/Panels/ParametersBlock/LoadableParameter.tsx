import { useEffect, useMemo } from "react";
import { path } from "rambda";
import { useController, useFormContext } from "react-hook-form";
import { z } from "zod";

import { DisplayError } from "@/components/Error";
import {
  DrawerSelect,
  DrawerSelectOptionGroup,
} from "@/components/Inputs/DrawerSelect";
import { TableSelect } from "@/components/Inputs/TableSelect";
import {
  LoadableValueGroups,
  LoadableValueGroupsSchema,
  LoadableValueTableSchema,
  LoadResultType,
} from "@/hooks/generate/schemas";
import { log } from "@/utils/log";

import { useFieldState } from "../../formStateContext";
import { ParameterComponent } from "./types";
import { useLoadableParamData } from "./useLoadableParamData";
import { useWatchActions } from "./useWatchActions";
import { normalizeKeyPath, normalizeLabel, withPrefix } from "./utils";

export const LoadableSelectParameter: ParameterComponent<"loadable_select"> = ({
  p,
  prefix,
}) => {
  const { data, status, error } = useLoadableParamData(
    withPrefix(prefix, p.name),
    p.load,
  );
  const { getValues } = useFormContext();

  const parsedData = useMemo(() => {
    if (!data) {
      return [];
    }

    const resultData = p.load.result.result_object_path
      ? path(normalizeKeyPath(p.load.result.result_object_path), data)
      : data;

    let parserSchema: z.ZodSchema<any>;
    if (p.load.result.type === LoadResultType.Table) {
      parserSchema = LoadableValueTableSchema;
    } else {
      parserSchema = LoadableValueGroupsSchema;
    }

    const parsed = parserSchema.safeParse(resultData);
    if (!parsed.success) {
      log.error(
        { error: parsed.error, name: p.name, load: p.load, data },
        "Failed to parse loadable data",
      );
      return [];
    }

    return parsed.data;
  }, [data, p.load, p.name]);

  const formattedData = useMemo(() => {
    if (!parsedData) {
      return [];
    }

    if (p.load.result.type === LoadResultType.Table) {
      return parsedData;
    }

    return (parsedData as LoadableValueGroups).map((group) => ({
      label: group.label,
      options: group.options.map((value) => ({
        label: value.label,
        value: value.name,
      })),
    })) as DrawerSelectOptionGroup[];
  }, [parsedData, p.load.result.type]);

  const name = withPrefix(prefix, p.name);
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, defaultValue: [] });

  useEffect(() => {
    if (p.load.result.type === LoadResultType.Table) {
      return;
    }

    const newSelected = new Set<string>();
    for (const group of parsedData) {
      for (const option of group.options) {
        if (option.value) {
          newSelected.add(option.name);
        }
      }
    }

    if (fieldState.isTouched) {
      // need to remove values which are not in the new data
      const selected = new Set<string>(getValues(name));
      const shouldRemove = selected.difference(newSelected);
      if (shouldRemove.size === 0) {
        return;
      }
      for (const value of shouldRemove) {
        newSelected.delete(value);
      }
    }

    field.onChange(Array.from(newSelected));
  }, [fieldState.isTouched, parsedData, p.load.result.type]);

  useWatchActions({
    watch: p.watch,
    prefix,
  });

  const state = useFieldState(name);

  if (state === "hidden") {
    return null;
  }

  if (status === "error") {
    return <DisplayError error={error} before={null} title={null} />;
  }

  if (p.load.result.type === LoadResultType.Table) {
    return (
      <TableSelect
        {...field}
        columns={p.load.result.columns}
        inputLabel={p.label}
        page={formattedData}
        label="Select"
        inputRef={ref}
        error={fieldState.error}
        loading={status === "pending"}
        multiple={p.multi}
        disabled={state === "disabled"}
        size="xl"
        title={`Select ${normalizeLabel(p.label)}`}
        idField={p.load.result.fields.id}
        nameField={p.load.result.fields.name}
      />
    );
  }

  return (
    <DrawerSelect
      inputLabel={p.label}
      options={formattedData}
      label="Select"
      {...field}
      inputRef={ref}
      error={fieldState.error}
      loading={status === "pending"}
      multiple={p.multi}
      size="lg"
      disabled={state === "disabled"}
      title={`Select ${normalizeLabel(p.label)}`}
    />
  );
};
