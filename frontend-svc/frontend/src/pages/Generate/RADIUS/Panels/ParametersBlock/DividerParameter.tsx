import { Divider } from "@mantine/core";

import type { ParameterComponent } from "./types";

export const DividerParameter: ParameterComponent<"divider"> = ({
  p,
  ParamsMapped: _,
  prefix: _skip,
  ...props
}) => {
  return <Divider my={0} labelPosition="left" label={p.value} {...props} />;
};
