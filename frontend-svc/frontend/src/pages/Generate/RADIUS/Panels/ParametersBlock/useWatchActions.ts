import { useEffect, useMemo } from "react";
import { pascalCase } from "change-case";
import { Control, useWatch } from "react-hook-form";

import { Watch, WatchAction } from "@/hooks/generate/schemas";

import { useFormState } from "../../formStateContext";
import { withPrefix } from "./utils";

type WatchActionEventHandler = (
  action: WatchAction,
  actionParams: any,
  field: string,
  target: string,
) => void;

interface WatchActionsOptions
  extends Partial<
    Record<
      `on${CapitalizeSnakeCase<WatchAction> | "Any"}`,
      WatchActionEventHandler
    >
  > {
  watch: Watch[] | null | undefined;
  control?: Control;
  prefix?: string;
}

const addPrefix = (prefix: string | undefined, field: string): string => {
  if (!field.startsWith(".") || !prefix) {
    return field;
  }
  return withPrefix(prefix, field.slice(1));
};

const isValue = (formValue: unknown, value: unknown): boolean => {
  if (Array.isArray(formValue)) {
    return formValue.includes(value);
  }
  return formValue === value;
};

export function useWatchActions({
  control,
  watch,
  prefix,
  ...actions
}: WatchActionsOptions) {
  const watchFields = useMemo(
    () => watch?.map((w) => addPrefix(prefix, w.field)) ?? [],
    [watch, prefix],
  );

  const values = useWatch({
    control,
    name: watchFields,
    disabled: !watch || watch.length === 0,
  });

  const formState = useFormState();

  useEffect(() => {
    if (!watch) {
      return;
    }

    for (let i = 0; i < watch.length; i++) {
      const value = values[i];
      const w = watch[i];
      const field = addPrefix(prefix, w.field);

      for (const when of w.when) {
        const is = isValue(value, when.value);
        if ((!when.not && is) || (when.not && !is)) {
          for (const act of when.acts) {
            const action =
              actions[
                `on${pascalCase(act.action) as CapitalizeSnakeCase<typeof act.action>}`
              ];
            const target = addPrefix(prefix, act.target);
            if (action) {
              action(act.action, act.value, field, target);
            }
            actions.onAny?.(act.action, act.value, field, target);

            switch (act.action) {
              case WatchAction.SetValue:
              case WatchAction.HideValues:
              case WatchAction.ShowValues:
                continue;
              case WatchAction.Hide:
                formState.assign({ [target]: "hidden" });
                continue;
              case WatchAction.Show:
                formState.assign({ [target]: "enabled" });
                continue;
              case WatchAction.Disable:
                formState.assign({ [target]: "disabled" });
                continue;
              case WatchAction.Enable:
                formState.assign({ [target]: "enabled" });
                continue;
              default:
                const exhaustiveCheck: never = act.action;
                throw new Error(`Unhandled action: ${exhaustiveCheck}`);
            }
          }
        }
      }
    }
  }, [values, watch]);
}
