import { useController } from "react-hook-form";

import type { ParameterComponent } from "./types";
import { withPrefix } from "./utils";

export const HiddenParameter: ParameterComponent<"hidden"> = ({
  p,
  prefix,
}) => {
  const name = withPrefix(prefix, p.name);
  const { field } = useController({ name, defaultValue: p.value });

  return <input type="hidden" {...field} />;
};
