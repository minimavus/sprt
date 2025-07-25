import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
} from "react";

import type { RadiusAttributeLocation } from "../../form";
import { type AttributeKey, radiusParamsStore$ } from "../../store";
import { attrValuesToItems, type Item } from "./formatters";

type store = Observable<{
  key: AttributeKey;
  values: () => Item[] | null;
  loc: RadiusAttributeLocation | null;
  filteredValues: () => Item[] | null;
}>;

const ValuesContext = createContext<store>(undefined as any);

export const useValuesContext = () => useContext(ValuesContext);

export const ValuesProvider: FC<PropsWithChildren<AttributeKey>> = ({
  children,
  ...key
}) => {
  const localStore = useObservable({
    key,
    values: () => {
      const raw = radiusParamsStore$.radius
        .valuesOf(localStore.key.get())
        .get();
      if (!raw) {
        return null;
      }
      return attrValuesToItems(raw);
    },
    loc: null as RadiusAttributeLocation | null,
    filteredValues: () => {
      let values = localStore.values.get();
      if (!values) {
        return [] as Item[];
      }

      if (localStore.loc.get()) {
        values = values.filter((v) => !v.loc || v.loc === localStore.loc.get());
      }

      return values;
    },
  });

  return <ValuesContext value={localStore}>{children}</ValuesContext>;
};
