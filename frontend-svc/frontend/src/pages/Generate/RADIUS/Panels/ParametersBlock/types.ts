import type { FC, ReactNode } from "react";

import type { Parameter, ParametersBlock } from "@/hooks/generate/schemas";

export type DynamicParametersBlockProps = {
  block: ParametersBlock;
  prefix?: string;
};

export type Types = Parameter["type"];

export type ExtractParam<T, U extends Types> = T extends { type: infer V }
  ? V extends U
    ? T
    : never
  : never;

export type ParamsMappedProps = {
  params: Parameter[] | null | undefined;
  prefix: string;
  render?: (children: ReactNode) => ReactNode;
  childrenProps?: Record<string, any>;
  inline?: boolean;
};

type ParameterComponentProps<T extends Types> = {
  p: ExtractParam<Parameter, T>;
  prefix: string;
  ParamsMapped: FC<ParamsMappedProps>;
};

export type ParameterComponent<T extends Types> = FC<
  ParameterComponentProps<T>
>;
