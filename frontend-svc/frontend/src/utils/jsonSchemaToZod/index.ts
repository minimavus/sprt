import { z } from "zod";
import type {
  JsonSchema7AnyType,
  JsonSchema7ArrayType,
  JsonSchema7EnumType,
  JsonSchema7NumberType,
  JsonSchema7ObjectType,
  JsonSchema7SetType,
  JsonSchema7StringType,
} from "zod-to-json-schema";

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

export function jsonSchemaToZod(jsonSchema: JsonSchema7AnyType): z.ZodSchema {
  let schema: z.ZodSchema;
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

function jsonAnyOfTypeToZod(schema: JsonSchema7AnyOfType): z.ZodSchema {
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

function jsonOneOfTypeToZod(schema: JsonSchema7OneOfType): z.ZodSchema {
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

function createStringSchema(jsonSchema: JsonSchema7StringType): z.ZodSchema {
  let schema = z.string();
  if (jsonSchema.minLength !== undefined) {
    schema = schema.min(
      jsonSchema.minLength,
      jsonSchema.errorMessage?.minLength,
    );
  }
  if (jsonSchema.maxLength !== undefined) {
    schema = schema.max(
      jsonSchema.maxLength,
      jsonSchema.errorMessage?.maxLength,
    );
  }
  if (jsonSchema.pattern !== undefined) {
    schema = schema.regex(
      new RegExp(jsonSchema.pattern),
      jsonSchema.errorMessage?.pattern,
    );
  }
  if (jsonSchema.format !== undefined) {
    switch (jsonSchema.format) {
      case "email":
      case "idn-email":
        schema = schema.email(jsonSchema.errorMessage?.format);
        break;
      case "uri":
        schema = schema.url(jsonSchema.errorMessage?.format);
        break;
      case "uuid":
        schema = schema.uuid(jsonSchema.errorMessage?.format);
        break;
      case "date-time":
        schema = schema.date(jsonSchema.errorMessage?.format);
        break;
      case "ipv4":
        schema = schema.ip({
          version: "v4",
          message: jsonSchema.errorMessage?.format,
        });
        break;
      case "ipv6":
        schema = schema.ip({
          version: "v6",
          message: jsonSchema.errorMessage?.format,
        });
        break;
      case "date":
        schema = schema.date(jsonSchema.errorMessage?.format);
        break;
      case "time":
        schema = schema.time(jsonSchema.errorMessage?.format);
        break;
      case "duration":
        schema = schema.duration(jsonSchema.errorMessage?.format);
        break;
    }
  }
  return schema;
}

function createObjectSchema(jsonSchema: JsonSchema7ObjectType): z.ZodSchema {
  let schema = z.object({});
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
  if (jsonSchema.additionalProperties) {
    (schema as z.ZodObject<any>) = schema.passthrough();
  }
  return schema;
}

function createNumberSchema(jsonSchema: JsonSchema7NumberType): z.ZodSchema {
  let schema = z.number();
  if (jsonSchema.minimum !== undefined) {
    schema = schema.min(jsonSchema.minimum, jsonSchema.errorMessage?.minimum);
  }
  if (jsonSchema.maximum !== undefined) {
    schema = schema.max(jsonSchema.maximum, jsonSchema.errorMessage?.maximum);
  }
  return schema;
}

function createEnumSchema(jsonSchema: JsonSchema7EnumType): z.ZodSchema {
  return z.enum(jsonSchema.enum as [string, ...string[]]);
}

function createArraySchema(jsonSchema: JsonSchema7ArrayType): z.ZodSchema {
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

function createSetSchema(jsonSchema: JsonSchema7SetType): z.ZodSchema {
  return z
    .array(jsonSchemaToZod(jsonSchema.items!))
    .superRefine((v, ctx) => {
      const s = new Set(v);
      if (s.size !== v.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Array contains duplicate values",
        });
        return z.NEVER;
      }
    })
    .transform((v) => Array.from(v));
}
