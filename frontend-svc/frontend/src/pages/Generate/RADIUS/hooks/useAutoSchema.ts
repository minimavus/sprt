import { useEffect } from "react";
import { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useAsyncValue } from "react-router-dom";
import { z } from "zod";

import { ProtoDefinition, VariableDefinition } from "@/hooks/generate/schemas";
import { jsonSchemaToZod } from "@/utils/jsonSchemaToZod";

import { radiusForm } from "../form";

export const useAutoSchema = ({
  value,
  schema$,
}: {
  value: VariableDefinition | null | undefined;
  schema$: Observable<z.ZodObject<any>>;
}) => {
  useEffect(() => {
    if (!Array.isArray(value?.schema) || value.schema.length === 0) {
      return;
    }

    const added: string[] = [];
    let tempSchema = schema$.get();
    for (let i = 0; i < value.schema.length; i++) {
      const schema = value.schema[i];
      const pp = value.parameters[i];

      // transform json schema to zod schema and extend schema$
      const sc = jsonSchemaToZod(schema);
      tempSchema = tempSchema.extend({ [pp.prop_name]: sc }) as any;
      added.push(pp.prop_name);
    }
    schema$.set(tempSchema as any);

    return () => {
      const tempSchema = schema$.get();
      schema$.set(
        tempSchema.omit(
          added.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        ),
      );
    };
  }, [value]);
};

export const useAutoProtoSchema = () => {
  const schema$ = useObservable<z.ZodObject<any>>(radiusForm);

  const [, value] = useAsyncValue() as [unknown, ProtoDefinition | null];
  useAutoSchema({ value, schema$ });

  return schema$;
};
