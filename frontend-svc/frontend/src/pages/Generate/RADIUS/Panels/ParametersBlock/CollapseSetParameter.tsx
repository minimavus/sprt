import { Accordion, Stack } from "@mantine/core";

import type { ParameterComponent } from "./types";

export const CollapseSetParameter: ParameterComponent<"collapse_set"> = ({
  p,
  prefix,
  ParamsMapped,
  ...props
}) => {
  return (
    <Accordion defaultValue={null} radius="sm" variant="separated" {...props}>
      <Accordion.Item key={p.name} value={p.name}>
        <Accordion.Control>{p.label}</Accordion.Control>
        <Accordion.Panel>
          <Stack gap="xs">
            <ParamsMapped params={p.fields} prefix={prefix} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
