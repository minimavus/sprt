// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TabsProps } from "@mantine/core";

declare module "@mantine/core" {
  export interface TabsProps {
    "data-highlight"?: boolean;
  }
}
