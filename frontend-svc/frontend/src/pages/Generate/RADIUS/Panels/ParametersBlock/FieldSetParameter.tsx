import { Fieldset, Stack, Text } from "@mantine/core";
import { Fragment } from "react";
import Markdown from "react-markdown";

import type { ParameterComponent } from "./types";

export const FieldSetParameter: ParameterComponent<"field_set"> = ({
  p,
  prefix,
  ParamsMapped,
  ...props
}) => {
  return (
    <Fieldset
      legend={
        <Markdown
          components={{
            p: Fragment,
            strong: (props) => (
              <Text span fw="bold" c="blue" {...(props as any)} />
            ),
          }}
        >
          {p.label}
        </Markdown>
      }
      {...props}
    >
      <Stack gap="xs">
        <ParamsMapped params={p.fields} prefix={prefix} />
      </Stack>
    </Fieldset>
  );
};
