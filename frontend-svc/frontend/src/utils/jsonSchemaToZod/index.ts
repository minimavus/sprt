import type {
  JsonSchema7AnyType,
  JsonSchema7ArrayType,
  JsonSchema7EnumType,
  JsonSchema7NumberType,
  JsonSchema7ObjectType,
  JsonSchema7SetType,
  JsonSchema7StringType,
} from "zod-to-json-schema";
import { z } from "zod/v4";

import {
  isJsonSchema7AnyOfType,
  isJsonSchema7ArrayType,
  isJsonSchema7BooleanType,
  isJsonSchema7EnumType,
  isJsonSchema7LiteralType,
  isJsonSchema7NumberType,
  isJsonSchema7ObjectType,
  isJsonSchema7OneOfType,
  isJsonSchema7SetType,
  isJsonSchema7StringType,
  type JsonSchema7AnyOfType,
  type JsonSchema7OneOfType,
} from "./guards";

export function jsonSchemaToZod(jsonSchema: JsonSchema7AnyType): z.ZodType {
  let schema: z.ZodType;
  if (isJsonSchema7AnyOfType(jsonSchema)) {
    schema = jsonAnyOfTypeToZod(jsonSchema);
  } else if (isJsonSchema7OneOfType(jsonSchema)) {
    schema = jsonOneOfTypeToZod(jsonSchema);
  } else if (isJsonSchema7SetType(jsonSchema)) {
    schema = createSetSchema(jsonSchema);
  } else if (isJsonSchema7ArrayType(jsonSchema)) {
    schema = createArraySchema(jsonSchema);
  } else if (isJsonSchema7BooleanType(jsonSchema)) {
    schema = z.boolean();
  } else if (isJsonSchema7EnumType(jsonSchema)) {
    schema = createEnumSchema(jsonSchema);
  } else if (isJsonSchema7LiteralType(jsonSchema)) {
    schema = z.literal(jsonSchema.const);
  } else if (isJsonSchema7NumberType(jsonSchema)) {
    schema = createNumberSchema(jsonSchema);
  } else if (isJsonSchema7ObjectType(jsonSchema)) {
    schema = createObjectSchema(jsonSchema);
  } else if (isJsonSchema7StringType(jsonSchema)) {
    schema = createStringSchema(jsonSchema);
  } else {
    throw new Error("Unsupported schema type");
  }

  return schema;
}

function jsonAnyOfTypeToZod(schema: JsonSchema7AnyOfType): z.ZodType {
  let discriminator: Set<string> | null = null;

  for (const s of schema.anyOf) {
    if (isJsonSchema7ObjectType(s)) {
      if (!discriminator) {
        discriminator = new Set(Object.keys(s.properties!));
      } else {
        discriminator = discriminator.intersection(
          new Set(Object.keys(s.properties!)),
        );
      }
    }
  }

  if (discriminator?.size === 1) {
    const d = [...discriminator][0];
    return z.discriminatedUnion(d, schema.anyOf.map(jsonSchemaToZod) as any);
  }

  return z.union(schema.anyOf.map(jsonSchemaToZod) as any);
}

function jsonOneOfTypeToZod(schema: JsonSchema7OneOfType): z.ZodType {
  return z.enum(
    schema.oneOf.map((v) => {
      if (!isJsonSchema7LiteralType(v)) {
        console.error(v);
        throw new Error("Unsupported schema type");
      }
      return v.const;
    }) as any,
  );
}

function createStringSchema(jsonSchema: JsonSchema7StringType): z.ZodType {
  let schema: z.ZodType = z.string();
  if (jsonSchema.minLength !== undefined) {
    schema = (schema as z.ZodString).min(
      jsonSchema.minLength,
      jsonSchema.errorMessage?.minLength,
    );
  }
  if (jsonSchema.maxLength !== undefined) {
    schema = (schema as z.ZodString).max(
      jsonSchema.maxLength,
      jsonSchema.errorMessage?.maxLength,
    );
  }
  if (jsonSchema.pattern !== undefined) {
    schema = (schema as z.ZodString).regex(
      new RegExp(jsonSchema.pattern),
      jsonSchema.errorMessage?.pattern,
    );
  }
  if (jsonSchema.format !== undefined) {
    switch (jsonSchema.format) {
      case "email":
      case "idn-email":
        schema = schema.and(z.email(jsonSchema.errorMessage?.format));
        break;
      case "uri":
        schema = schema.and(z.url(jsonSchema.errorMessage?.format));
        break;
      case "uuid":
        schema = schema.and(z.uuid(jsonSchema.errorMessage?.format));
        break;
      case "date-time":
        schema = schema.and(z.iso.datetime(jsonSchema.errorMessage?.format));
        break;
      case "ipv4":
        schema = schema.and(z.ipv4(jsonSchema.errorMessage?.format));
        break;
      case "ipv6":
        schema = schema.and(z.ipv6(jsonSchema.errorMessage?.format));
        break;
      case "date":
        schema = schema.and(z.iso.date(jsonSchema.errorMessage?.format));
        break;
      case "time":
        schema = schema.and(z.iso.time(jsonSchema.errorMessage?.format));
        break;
      case "duration":
        schema = schema.and(z.iso.duration(jsonSchema.errorMessage?.format));
        break;
    }
  }
  return schema;
}

function createObjectSchema(jsonSchema: JsonSchema7ObjectType): z.ZodType {
  let schema: z.ZodObject;

  if (jsonSchema.additionalProperties) {
    schema = z.looseObject({});
  } else {
    schema = z.strictObject({});
  }

  if (jsonSchema.properties !== undefined) {
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      let tmp = jsonSchemaToZod(value);
      if (!jsonSchema.required || !jsonSchema.required?.includes(key)) {
        tmp = tmp.optional();
      }

      schema = schema.extend({
        [key]: tmp,
      });
    }
  }

  return schema;
}

function createNumberSchema(jsonSchema: JsonSchema7NumberType): z.ZodType {
  let schema = z.number();
  if (jsonSchema.minimum !== undefined) {
    schema = schema.min(jsonSchema.minimum, jsonSchema.errorMessage?.minimum);
  }
  if (jsonSchema.maximum !== undefined) {
    schema = schema.max(jsonSchema.maximum, jsonSchema.errorMessage?.maximum);
  }
  return schema;
}

function createEnumSchema(jsonSchema: JsonSchema7EnumType): z.ZodType {
  return z.enum(jsonSchema.enum as [string, ...string[]]);
}

function createArraySchema(jsonSchema: JsonSchema7ArrayType): z.ZodType {
  let schema = z.array(jsonSchemaToZod(jsonSchema.items!));
  if (jsonSchema.maxItems !== undefined) {
    schema = schema.max(
      jsonSchema.maxItems,
      jsonSchema.errorMessages?.maxItems,
    );
  }
  if (jsonSchema.minItems !== undefined) {
    schema = schema.min(
      jsonSchema.minItems,
      jsonSchema.errorMessages?.minItems,
    );
  }
  return schema;
}

function createSetSchema(jsonSchema: JsonSchema7SetType): z.ZodType {
  return z
    .array(jsonSchemaToZod(jsonSchema.items!))
    .check((ctx) => {
      const s = new Set(ctx.value);
      if (s.size !== ctx.value.length) {
        ctx.issues.push({
          code: "custom",
          message: "Array contains duplicate values",
          input: ctx.value,
        });
        return z.NEVER;
      }
    })
    .transform((v) => Array.from(v));
}
