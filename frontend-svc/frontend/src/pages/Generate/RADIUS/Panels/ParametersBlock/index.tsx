import { type FC } from "react";

import { log } from "@/utils/log";

import { useFieldState } from "../../formStateContext";
import { BlockContext, useIsInline } from "./blockContext";
import { CheckBoxesParameter } from "./CheckBoxesParameter";
import { CheckBoxParameter } from "./CheckBoxParameter";
import { CollapseSetParameter } from "./CollapseSetParameter";
import { ColumnsParameter } from "./ColumnsParameter";
import { DictionaryParameter } from "./DictionaryParameter";
import { DividerParameter } from "./DividerParameter";
import { FieldSetParameter } from "./FieldSetParameter";
import { HiddenParameter } from "./HiddenParameter";
import { ListParameter } from "./ListParameter";
import { LoadableSelectParameter } from "./LoadableParameter";
import { NumberInputParameter } from "./NumberInputParameter";
import { RadioParameter } from "./RadioParameter";
import { SelectParameter } from "./SelectParameter";
import { TextInputParameter } from "./TextInputParameter";
import { TextParameter } from "./TextParameter";
import type {
  DynamicParametersBlockProps,
  ParameterComponent,
  ParamsMappedProps,
  Types,
} from "./types";
import { useWatchActions } from "./useWatchActions";
import { withPrefix } from "./utils";
import { VariantsParameter } from "./VariantsParameter";

const DictionariesParameter: ParameterComponent<"dictionary"> = ({
  p,
  prefix,
}) => {
  const name = withPrefix(prefix, p.name);
  const state = useFieldState(name);

  useWatchActions({
    watch: p.watch,
    prefix,
  });

  const inline = useIsInline();

  if (state === "hidden") {
    return null;
  }

  return (
    <DictionaryParameter
      name={name}
      types={p.dictionary_types}
      withAllowRepeats
      allowRepeats={p.allow_repeats}
      withSelect
      select={p.select}
      disabled={state === "disabled"}
      label={p.label}
      value={p.value}
      flex={inline ? 1 : undefined}
    />
  );
};

const componentsMap = new Map<Types | "unknown", ParameterComponent<any>>([
  ["checkbox", CheckBoxParameter],
  ["checkboxes", CheckBoxesParameter],
  ["columns", ColumnsParameter],
  ["dictionary", DictionariesParameter],
  ["hidden", HiddenParameter],
  ["list", ListParameter],
  ["loadable_select", LoadableSelectParameter],
  ["select", SelectParameter],
  ["number_input", NumberInputParameter],
  ["radio", RadioParameter],
  ["text_input", TextInputParameter],
  ["text", TextParameter],
  ["variants", VariantsParameter],
  ["divider", DividerParameter],
  ["field_set", FieldSetParameter],
  ["collapse_set", CollapseSetParameter],
  [
    "unknown",
    ({ p }) => {
      log.warn(`Unknown parameter type: ${p.type}`);
      return null;
    },
  ],
]);

const ParamsMapped: FC<ParamsMappedProps> = ({
  params,
  prefix,
  render,
  childrenProps,
  inline,
}) => {
  if (!params || !Array.isArray(params) || params.length === 0) return null;

  const children = params.map((param) => {
    const El = componentsMap.get(param.type) || componentsMap.get("unknown")!;
    return (
      <El
        key={param.name}
        p={param}
        prefix={prefix}
        ParamsMapped={ParamsMapped}
        {...childrenProps}
      />
    );
  });

  const isAlreadyInline = useIsInline();

  return (
    <BlockContext value={{ inline: inline || isAlreadyInline }}>
      {render ? render(children) : children}
    </BlockContext>
  );
};

export const DynamicParametersBlock: FC<DynamicParametersBlockProps> = ({
  block,
  prefix = "",
}) => {
  return (
    <ParamsMapped
      params={block.parameters}
      prefix={prefix || block.prop_name}
    />
  );
};
