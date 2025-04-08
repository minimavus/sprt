import type {
  JsonSchema7AnyType,
  JsonSchema7ArrayType,
  JsonSchema7BooleanType,
  JsonSchema7EnumType,
  JsonSchema7LiteralType,
  JsonSchema7NumberType,
  JsonSchema7ObjectType,
  JsonSchema7SetType,
  JsonSchema7StringType,
} from "zod-to-json-schema";

export type JsonSchema7AnyOfType = {
  anyOf: JsonSchema7AnyType[];
};

export type JsonSchema7OneOfType = {
  oneOf: JsonSchema7AnyType[];
};

export const isJsonSchema7AnyOfType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7AnyOfType => {
  return schema && (schema as JsonSchema7AnyOfType).anyOf !== undefined;
};

export const isJsonSchema7OneOfType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7OneOfType => {
  return schema && (schema as JsonSchema7OneOfType).oneOf !== undefined;
};

export const isJsonSchema7ArrayType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7ArrayType => {
  return schema && (schema as JsonSchema7ArrayType).type === "array";
};

export const isJsonSchema7BooleanType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7BooleanType => {
  return schema && (schema as JsonSchema7BooleanType).type === "boolean";
};

export const isJsonSchema7EnumType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7EnumType => {
  return schema && (schema as JsonSchema7EnumType).enum !== undefined;
};

export const isJsonSchema7LiteralType = (
  schema: JsonSchema7AnyType,
): schema is Exclude<JsonSchema7LiteralType, { type: "array" | "object" }> => {
  return schema && (schema as any).const !== undefined;
};

export const isJsonSchema7NumberType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7NumberType => {
  return schema && (schema as JsonSchema7NumberType).type === "number";
};

export const isJsonSchema7ObjectType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7ObjectType => {
  return schema && (schema as JsonSchema7ObjectType).type === "object";
};

export const isJsonSchema7SetType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7SetType => {
  return (
    schema &&
    (schema as JsonSchema7SetType).type === "array" &&
    (schema as JsonSchema7SetType).uniqueItems === true
  );
};

export const isJsonSchema7StringType = (
  schema: JsonSchema7AnyType,
): schema is JsonSchema7StringType => {
  return schema && (schema as JsonSchema7StringType).type === "string";
};
