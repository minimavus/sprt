import { useMemo } from "react";
import { observable } from "@legendapp/state";
// import { configureObservableSync, syncObservable } from "@legendapp/state/sync"

// import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { use$ } from "@legendapp/state/react";

import { ServerSettings } from "@/hooks/settings/servers";

// configureObservablePersistence({
//   pluginLocal: ObservablePersistLocalStorage,
// });
export const serverSettingsDisplayStore$ = observable({
  displayGrouped: false,
  setGrouped: (value: boolean) => {
    serverSettingsDisplayStore$.displayGrouped.set(value);
  },
  toggleGrouped: () => {
    serverSettingsDisplayStore$.displayGrouped.set(
      !serverSettingsDisplayStore$.displayGrouped.get(),
    );
  },
});

// persistObservable(serverSettingsDisplayStore$, {
//   local: "serversSettingsDisplayStore",
// });

const groupServers = (
  servers: ServerSettings[],
): Record<string, ServerSettings[]> => {
  const m: Record<string, ServerSettings[]> = {};

  for (let i = 0; i < servers.length; i++) {
    const element = servers[i];
    if (m[element.group]) m[element.group].push(element);
    else m[element.group] = [element];
  }

  return m;
};

export const useGroupedServers = (servers: ServerSettings[]) => {
  const grouped = use$(serverSettingsDisplayStore$.displayGrouped);

  return useMemo(
    () => (grouped ? groupServers(servers) : servers),
    [servers, grouped],
  );
};
