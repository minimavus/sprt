import { z } from "zod";

type ColumnsParameter = Base & {
  type: "columns";
  value: Parameter[][];
};

export enum WatchAction {
  SetValue = "set_value",
  HideValues = "hide_values",
  ShowValues = "show_values",
  Hide = "hide",
  Show = "show",
  Disable = "disable",
  Enable = "enable",
}

export enum Family {
  Unspecified = 0,
  IPv4 = 4,
  IPv6 = 6,
}

const ActSchema = z.object({
  action: z.nativeEnum(WatchAction),
  target: z.string(),
  value: z.any().optional(),
});

const WatchSchema = z.object({
  field: z.string(),
  when: z.array(
    z.object({
      value: z.any(),
      acts: z.array(ActSchema),
      not: z.boolean().optional(),
    }),
  ),
});

export type Watch = z.infer<typeof WatchSchema>;

export type Variant = {
  desc: string;
  name: string;
  short: string;
  show_if_checked: boolean;
  fields?: Parameter[] | null | undefined;
  watch?: Watch[] | null | undefined;
};

type VariantsParameter = Base & {
  type: "variants";
  variants: Variant[];
  title: string;
  inline?: boolean;
  value?: string;
};

export type Parameter =
  | TextParameter
  | CheckboxParameter
  | HiddenParameter
  | SelectParameter
  | LoadableSelectParameter
  | RadioParameter
  | ColumnsParameter
  | ListParameter
  | VariantsParameter
  | DictionaryParameter
  | TextInputParameter
  | NumberInputParameter
  | CheckBoxesParameter
  | Divider
  | FieldOrCollapseSetParameter;

export type ParametersBlock = {
  title: string;
  parameters: Parameter[];
  prop_name: string;
};

export interface VariableDefinition {
  parameters: ParametersBlock[];
  schema: any[] | undefined;
}

export interface ProtoDefinition extends VariableDefinition {
  proto_name: string;
  radius: {
    access_request: ProtoRadiusAttribute[];
    accounting_start: ProtoRadiusAttribute[];
  };
}

const RadiusAttributeSchema = z.object({
  id: z.string(),
  value: z.string(),
  custom_values: z.array(z.string()).optional(),
  overwrite: z.boolean(),
  dictionary: z.string().optional(),
  non_removable: z.boolean().optional().default(false),
  vendor: z.string().optional(),
  family_specific: z.nativeEnum(Family).optional(),
});

export type ProtoRadiusAttribute = z.infer<typeof RadiusAttributeSchema>;

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const BaseSchema = z.object({
  type: z.string(),
  name: z.string(),
  advanced: z.boolean(),
  update_on_change: z.array(z.string()).optional(),
  watch: z.array(WatchSchema).optional(),
});

type Base = z.infer<typeof BaseSchema>;

const OptionWithValueSchema = z.object({
  value: z.any(),
  label: z.string(),
  name: z.string(),
});

const TextParameterSchema = BaseSchema.extend({
  type: z.literal("text"),
  value: z.string(),
  sub_type: z.enum(["divider", "warning", "error", "example"]).optional(),
});

const inputSideButtonValueSchema = z.object({
  type: z.literal("value"),
  value: z.string(),
  title: z.string(),
  insert: z.boolean().optional(),
});

type InputSideButtonValue = z.infer<typeof inputSideButtonValueSchema>;

type InputSideButtonValues =
  | InputSideButtonValue
  | {
      type: "group";
      title: string;
      values: InputSideButtonValue[];
    }
  | {
      type: "action";
      title: string;
      action: string;
    };

const inputSideButtonValuesSchema: z.ZodType<InputSideButtonValues> = z.union([
  z.lazy(() => inputSideButtonValueSchema) as any,
  z.object({
    type: z.literal("group"),
    title: z.string(),
    values: z.array(inputSideButtonValueSchema),
  }),
  z.object({
    type: z.literal("action"),
    title: z.string(),
    action: z.string(),
  }),
]);

const inputSideButtonSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  type: z.enum(["dropdown", "button"]),
  name: z.string().optional(),
  values: z.array(inputSideButtonValuesSchema).optional(),
});

export type InputSideButton = z.infer<typeof inputSideButtonSchema>;

const basicValueInputSchema = BaseSchema.extend({
  label: z.string(),
  description: z.string().optional(),
  readonly: z.boolean().optional(),
  hint: z.string().optional(),
  buttons: z.array(inputSideButtonSchema).optional(),
});

type TextParameter = z.infer<typeof TextParameterSchema>;

const TextInputParameterSchema = basicValueInputSchema.extend({
  type: z.literal("text_input"),
  value: z.string(),
});

type TextInputParameter = z.infer<typeof TextInputParameterSchema>;

const NumberInputParameterSchema = basicValueInputSchema.extend({
  type: z.literal("number_input"),
  value: z.number(),
});

type NumberInputParameter = z.infer<typeof NumberInputParameterSchema>;

const CheckboxParameterSchema = BaseSchema.extend({
  type: z.literal("checkbox"),
  value: z.boolean(),
  label: z.string(),
});

type CheckboxParameter = z.infer<typeof CheckboxParameterSchema>;

const CheckBoxesParameterSchema = BaseSchema.extend({
  type: z.literal("checkboxes"),
  options: z.array(OptionWithValueSchema),
  label: z.string(),
});

type CheckBoxesParameter = z.infer<typeof CheckBoxesParameterSchema>;

const HiddenParameterSchema = BaseSchema.extend({
  type: z.literal("hidden"),
  value: z.string(),
});

type HiddenParameter = z.infer<typeof HiddenParameterSchema>;

const SelectParameterSchema = BaseSchema.extend({
  type: z.literal("select"),
  options: z.array(OptionSchema),
  value: z.array(z.string()).or(z.string()),
  multi: z.boolean().optional(),
  label: z.string().optional(),
});

type SelectParameter = z.infer<typeof SelectParameterSchema>;

export enum LoadResultType {
  Groups = "groups",
  Table = "table",
}

const resultSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(LoadResultType.Groups),
    paging: z.boolean().optional(),
    attribute: z.string().optional(),
    fields: z
      .object({
        name: z.string(),
        id: z.string(),
      })
      .optional(),
    pagination_path: z.string().optional(),
    result_object_path: z.string().optional(),
  }),
  z.object({
    type: z.literal(LoadResultType.Table),
    paging: z.boolean().default(false),
    fields: z.object({
      name: z.string(),
      id: z.string(),
    }),
    columns: z.array(
      z.object({
        title: z.string(),
        field: z.string(),
      }),
    ),
    pagination_path: z.string().optional(),
    result_object_path: z.string().optional(),
  }),
]);

const LoadParamsSchema = z.object({
  link: z.string(),
  method: z.string(),
  request: z.record(z.string(), z.any()).optional(),
  result: resultSchema,
});

export type LoadParams = z.infer<typeof LoadParamsSchema>;

const LoadableSelectParameterSchema = BaseSchema.extend({
  type: z.literal("loadable_select"),
  load: LoadParamsSchema,
  multi: z.boolean().optional(),
  label: z.string(),
});

type LoadableSelectParameter = z.infer<typeof LoadableSelectParameterSchema>;

const RadioParameterSchema = BaseSchema.extend({
  type: z.literal("radio"),
  options: z.array(OptionSchema),
  value: z.string(),
  label: z.string(),
});

type RadioParameter = z.infer<typeof RadioParameterSchema>;

const ColumnsParameterSchema: z.ZodType<ColumnsParameter> = BaseSchema.extend({
  type: z.literal("columns"),
  value: z.array(z.array(z.lazy(() => ParameterSchema))),
});

const ListParameterSchema = BaseSchema.extend({
  type: z.literal("list"),
  value: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  allow_from_file: z.boolean().optional(),
  validate: z.boolean().optional(),
});

type ListParameter = z.infer<typeof ListParameterSchema>;

const VariantSchema: z.ZodType<Variant> = z.object({
  desc: z.string(),
  name: z.string(),
  short: z.string(),
  show_if_checked: z.boolean(),
  fields: z
    .array(z.lazy(() => ParameterSchema))
    .nullable()
    .default([]),
  watch: z.array(WatchSchema).nullable().default([]),
});

const VariantsParameterSchema = BaseSchema.extend({
  type: z.literal("variants"),
  variants: z.array(VariantSchema),
  title: z.string(),
  inline: z.boolean().optional(),
  value: z.string().optional(),
});

export enum SelectFromDictionary {
  Sequential = "sequential",
  Random = "random",
}

const DictionaryParameterSchema = BaseSchema.extend({
  type: z.literal("dictionary"),
  value: z.array(z.string()).or(z.string()),
  dictionary_types: z.array(z.string()),
  label: z.string().optional(),
  select: z
    .nativeEnum(SelectFromDictionary)
    .optional()
    .default(SelectFromDictionary.Sequential),
  allow_repeats: z.boolean().optional().default(false),
});

type DictionaryParameter = z.infer<typeof DictionaryParameterSchema>;

const DividerSchema = BaseSchema.extend({
  type: z.literal("divider"),
  value: z.string().optional(),
});

export type Divider = z.infer<typeof DividerSchema>;

const FieldOrCollapseSetParameterSchema = BaseSchema.extend({
  type: z.enum(["field_set", "collapse_set"]),
  label: z.string(),
  fields: z
    .array(z.lazy(() => ParameterSchema))
    .nullable()
    .default([]),
});

export interface FieldOrCollapseSetParameter extends Base {
  type: "field_set" | "collapse_set";
  label: string;
  fields: Parameter[];
}

const ParameterSchema: z.ZodType<Parameter> = z.discriminatedUnion("type", [
  TextParameterSchema,
  CheckboxParameterSchema,
  HiddenParameterSchema,
  SelectParameterSchema,
  LoadableSelectParameterSchema,
  RadioParameterSchema,
  ColumnsParameterSchema as any,
  ListParameterSchema,
  VariantsParameterSchema,
  DictionaryParameterSchema,
  TextInputParameterSchema,
  NumberInputParameterSchema,
  CheckBoxesParameterSchema,
  DividerSchema,
  FieldOrCollapseSetParameterSchema,
]);

const ParametersBlockSchema = z.object({
  title: z.string(),
  parameters: z.array(ParameterSchema),
  prop_name: z.string(),
});

const ProtoRadiusSchema = z.object({
  access_request: z.array(RadiusAttributeSchema).nullable(),
  accounting_start: z.array(RadiusAttributeSchema).nullable(),
});

const VariableDefinitionSchema = z.object({
  parameters: z.array(ParametersBlockSchema),
  schema: z.array(z.any()).optional(),
});

const ProtoDefinitionSchema = VariableDefinitionSchema.extend({
  proto_name: z.string(),
  radius: ProtoRadiusSchema,
});

const NADSourceSchema = z.object({
  address: z.union([z.ipv4(), z.ipv6()]),
  family: z.enum(Family),
  interface: z.string(),
});

export type NADSource = z.infer<typeof NADSourceSchema>;

const NADSourcesResponseSchema = z.array(NADSourceSchema);

export type NADSourcesResponse = z.infer<typeof NADSourcesResponseSchema>;

export {
  BaseSchema,
  CheckboxParameterSchema,
  ColumnsParameterSchema,
  HiddenParameterSchema,
  ListParameterSchema,
  LoadableSelectParameterSchema,
  NADSourceSchema,
  NADSourcesResponseSchema,
  OptionSchema,
  ParametersBlockSchema,
  ParameterSchema,
  ProtoDefinitionSchema,
  RadioParameterSchema,
  RadiusAttributeSchema,
  SelectParameterSchema,
  TextParameterSchema,
  VariableDefinitionSchema,
  VariantSchema,
  VariantsParameterSchema,
  FieldOrCollapseSetParameterSchema,
};

const LoadableValueGroupSchema = z.object({
  label: z.string(),
  name: z.string(),
  options: z.array(OptionWithValueSchema),
});

export type LoadableValueGroup = z.infer<typeof LoadableValueGroupSchema>;

export const LoadableValueGroupsSchema = z
  .array(LoadableValueGroupSchema)
  .nullable()
  .transform((v) => v ?? []);

export type LoadableValueGroups = z.infer<typeof LoadableValueGroupsSchema>;

export const LoadableValueTableSchema = z
  .array(z.record(z.string(), z.any()))
  .nullable()
  .transform((v) => v ?? []);

export type LoadableValueTable = z.infer<typeof LoadableValueTableSchema>;
