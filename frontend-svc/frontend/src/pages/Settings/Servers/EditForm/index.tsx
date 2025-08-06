import { Tabs } from "@mantine/core";
import type { FC } from "react";

import { GeneralServerFields } from "./GeneralServerFields";
import { RadiusFields } from "./RadiusFields";
import { TacacsFields } from "./TacacsFields";

export const EditForm: FC = () => {
  return (
    <Tabs defaultValue="general">
      <Tabs.List>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="radius">RADIUS</Tabs.Tab>
        <Tabs.Tab value="tacacs">TACACS+</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general" pt="md">
        <GeneralServerFields />
      </Tabs.Panel>
      <Tabs.Panel value="radius" pt="md">
        <RadiusFields />
      </Tabs.Panel>
      <Tabs.Panel value="tacacs" pt="md">
        <TacacsFields />
      </Tabs.Panel>
    </Tabs>
  );
};
