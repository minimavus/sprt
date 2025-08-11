import { use$, useObservable } from "@legendapp/state/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useMemo } from "react";
import { type Control, useFormContext, useWatch } from "react-hook-form";

import type { LoadParams } from "@/hooks/generate/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { orMe } from "@/utils/orMe";

type Value<T> = {
  value: T;
  withAll: boolean;
};

const getLoadableQueryKey = (
  name: string,
  u: string,
  params: Pick<LoadParams, "link" | "method" | "request">,
) => {
  return ["generate", "loadable", name, u, params] as const;
};

const replaceVariablesInString = (
  str: string,
  variables: Record<string, any>,
): Value<string> => {
  if (!str) {
    return { value: str, withAll: false };
  }

  let gotAll = true;
  for (const [k, v] of Object.entries(variables)) {
    str = str.replace(new RegExp(`{{${k}}}`, "g"), v);
    if (v === null || v === undefined) {
      gotAll = false;
    }
  }

  return { value: str, withAll: gotAll };
};

const replaceVariablesInObject = <T extends Record<string, any>>(
  obj: T,
  variables: Record<string, any>,
): Value<T> => {
  if (!obj) {
    return { value: obj, withAll: false };
  }

  const newObj = { ...obj };
  let gotAll = true;
  for (const [k, v] of Object.entries(newObj)) {
    if (typeof v === "string") {
      const c = replaceVariablesInString(v, variables);
      (newObj as any)[k] = c.value;
      if (!c.withAll) {
        gotAll = false;
      }
    }
  }

  return { value: newObj, withAll: gotAll };
};

const variableRegex = /{{([^}]+)}}/g;

const globals = new Map<string, any>([["API_PREFIX", api.v2``]]);

const useVariables = (params: LoadParams, control: Control) => {
  const variables$ = useObservable({});
  const watchables = useMemo(() => {
    const matches = params.link.matchAll(variableRegex);
    if (matches) {
      for (const match of matches) {
        const [, name] = match;
        variables$.assign({ [name]: globals.get(name) ?? null });
      }
    }
    if (params.request) {
      for (const ent of Object.values(params.request)) {
        if (typeof ent === "string") {
          const matches = ent.matchAll(variableRegex);
          if (matches) {
            for (const match of matches) {
              const [, name] = match;
              variables$.assign({ [name]: globals.get(name) ?? null });
            }
          }
        }
      }
    }
    let watchablesKeys = Object.keys(variables$.get()).filter(
      (k) => k.startsWith(".") || k.startsWith("/"),
    );
    let watchables: { key: string; path: string }[] = [];
    if (watchablesKeys.length > 0) {
      const mount = Array.from(control._names.mount);
      watchables = watchablesKeys
        .map((key) =>
          key.startsWith("/")
            ? { key, path: key.slice(1) }
            : { key, path: mount.find((m) => m.endsWith(key)) },
        )
        .filter((v) => Boolean(v.path)) as { key: string; path: string }[];
    }
    return watchables;
  }, [params.link, params.request, control]);

  const values = useWatch({ control, name: watchables.map((w) => w.path) });
  useEffect(() => {
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      const key = watchables[i].key;
      variables$.assign({ [key]: val });
    }
  }, [values, watchables]);

  return variables$;
};

export const useLoadableParamData = (name: string, params: LoadParams) => {
  const { control } = useFormContext();
  const [u] = useQueryUser();

  const vars = useVariables(params, control);

  const [link, request] = use$(() => {
    const link = replaceVariablesInString(params.link, vars.get());
    const request = replaceVariablesInObject(params.request ?? {}, vars.get());
    return [link, request];
  });

  return useQuery({
    queryKey: getLoadableQueryKey(name, orMe(u), {
      link: link.withAll ? link.value : "",
      method: params.method,
      request: request.withAll ? request.value : undefined,
    }),
    enabled: link.withAll && request.withAll,
    queryFn: () =>
      axios
        .request({
          method: params.method,
          url: link.withAll ? link.value : "",
          data:
            params.method.toLowerCase() === "get" ? undefined : request.value,
          params: {
            user: u,
            ...(params.method.toLowerCase() === "get"
              ? request.value
              : undefined),
          },
        })
        .then((res) => res.data),
  });
};
