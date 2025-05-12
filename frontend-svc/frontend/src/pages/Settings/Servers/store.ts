import { observable } from "@legendapp/state";

// import { configureObservableSync, syncObservable } from "@legendapp/state/sync"

// import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

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
