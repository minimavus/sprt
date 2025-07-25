import { Anchor, Text } from "@mantine/core";
import { Fragment } from "react/jsx-runtime";
import Markdown from "react-markdown";

import { Warning } from "@/components/Alerts";
import { Link } from "@/components/Link";

import { HowItWorks } from "../../common/HowItWorks";
import type { ParameterComponent } from "./types";

export const TextParameter: ParameterComponent<"text"> = ({ p }) => {
  if (p.name === "how_works") {
    return <HowItWorks>{p.value}</HowItWorks>;
  }
  switch (p.sub_type) {
    case "divider":
    case "warning":
      return (
        <Warning>
          <Markdown
            components={{
              p: Fragment,
              a: ({ href, ...props }) =>
                href ? <Link to={href} {...props} /> : <Anchor {...props} />,
            }}
          >
            {p.value}
          </Markdown>
        </Warning>
      );
    case "error":
      return <Text c="red">{p.value}</Text>;
    case "example":
      return <Text fs="italic">{p.value}</Text>;
    default:
      return <Text>{p.value}</Text>;
  }
};
