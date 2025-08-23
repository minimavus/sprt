import type { RouteObject } from "react-router-dom";

import { APISettings } from "@/pages/Settings/API";
import { DefaultsSettings } from "@/pages/Settings/Defaults";
import { DictionariesSettings } from "@/pages/Settings/Dictionaries";
import { DictionariesOfType } from "@/pages/Settings/Dictionaries/DictionariesOfType";
import { DictionaryByID } from "@/pages/Settings/Dictionaries/DictionaryByID";
import { GlobalSettings, globalSettingsLoader } from "@/pages/Settings/Global";
import {
  PluginsPage,
  pluginsLoader,
} from "@/pages/Settings/Global/pluginsPage";
import { ServersSettings } from "@/pages/Settings/Servers";
import { Server } from "@/pages/Settings/Servers/Server";
import { SMSSettings } from "@/pages/Settings/SMSSettings";

export const settingsRoutes: RouteObject = {
  path: "/settings",
  handle: { title: "Settings" },
  children: [
    {
      path: "servers",
      handle: { title: "Servers" },
      element: <ServersSettings />,
      children: [
        {
          path: ":id",
          element: <Server />,
        },
      ],
    },
    {
      path: "api",
      handle: { title: "API" },
      element: <APISettings />,
    },
    {
      path: "preferences",
      handle: { title: "Generation Defaults" },
      element: <DefaultsSettings />,
    },
    {
      path: "sms-gateway",
      handle: { title: "Mock SMS Gateway" },
      element: <SMSSettings />,
    },
    {
      path: "dictionaries",
      handle: { title: "Dictionaries" },
      element: <DictionariesSettings />,
      children: [
        { path: ":type", element: <DictionariesOfType /> },
        { path: ":type/:id", element: <DictionaryByID /> },
      ],
    },
    {
      path: "global",
      handle: { title: "Global Settings" },
      element: <GlobalSettings />,
      loader: globalSettingsLoader,
    },
    {
      path: "plugins",
      handle: { title: "Plugins" },
      element: <PluginsPage />,
      loader: pluginsLoader,
    },
  ],
};
