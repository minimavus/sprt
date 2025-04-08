import { observable } from "@legendapp/state";

import { LogOwners } from "@/hooks/logs";

type OwnerType = "general" | "system";

const typeCheck =
  (t: OwnerType[]): ((o: LogOwners["owners"][number]) => boolean) =>
  (o) =>
    (o.owner.startsWith("_") && t.includes("system")) ||
    (!o.owner.startsWith("_") && t.includes("general"));

export const logOwnersStore$ = observable({
  filter: "",
  types: ["general" as OwnerType],
  hasType: (t: OwnerType) => logOwnersStore$.types.get().includes(t),
  rawOwners: [] as LogOwners["owners"],
  toggleType: (t: OwnerType) => {
    logOwnersStore$.types.set(
      logOwnersStore$.types.get().includes(t)
        ? logOwnersStore$.types.get().filter((tt) => tt !== t)
        : logOwnersStore$.types.get().concat([t]),
    );
  },
  filtered: (): LogOwners["owners"] => {
    const closure = typeCheck(logOwnersStore$.types.get());
    return logOwnersStore$.rawOwners
      .get()
      .filter(
        (o) =>
          (logOwnersStore$.filter.get() !== ""
            ? o.owner.includes(logOwnersStore$.filter.get())
            : true) && closure(o),
      );
  },
  total: () => {
    const closure = typeCheck(logOwnersStore$.types.get());
    return logOwnersStore$.rawOwners.get().filter(closure).length;
  },
});
