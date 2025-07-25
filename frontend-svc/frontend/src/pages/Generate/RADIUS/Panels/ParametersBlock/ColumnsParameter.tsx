import { SimpleGrid, Stack } from "@mantine/core";

import { useIsInline } from "./blockContext";
import type { ParameterComponent } from "./types";

export const ColumnsParameter: ParameterComponent<"columns"> = ({
  p,
  prefix,
  ParamsMapped,
  ...rest
}) => {
  const inline = useIsInline();
  return (
    <SimpleGrid
      cols={inline ? p.value.length : { base: 1, "750px": p.value.length }}
      type={inline ? undefined : "container"}
      flex={inline ? 1 : undefined}
      spacing="sm"
      {...rest}
    >
      {p.value.map((column, idx) => (
        <Stack key={idx} gap="sm">
          <ParamsMapped params={column} prefix={prefix} />
        </Stack>
      ))}
    </SimpleGrid>
  );
};
