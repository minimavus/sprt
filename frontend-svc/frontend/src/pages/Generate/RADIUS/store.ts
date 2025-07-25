import {
  batch,
  beginBatch,
  endBatch,
  mergeIntoObservable,
  observable,
} from "@legendapp/state";
import { equals } from "rambda";

import type { ProtoRadiusAttribute } from "@/hooks/generate/schemas";
import type {
  RadiusDictionaryAttribute,
  RadiusDictionaryBody,
  RadiusDictionaryValue,
} from "@/hooks/generate/useRadiusDictionaries";

import type { RadiusAttributeLocation, RadiusForm } from "./form";

export type Tab = StringWithKnownValues<
  | "general"
  | "mac_addresses"
  | "ip_addresses"
  | "radius"
  | "scheduler"
  | "api"
  | "coa"
  | "guest"
  | "proto_specific"
>;

const protoSpecificNumber = -1;

const populateAttributes = (
  dictionaryName: string,
  attributes: (RadiusDictionaryAttribute | null)[],
  vendor?: string,
) => {
  for (const attr of attributes) {
    if (!attr) {
      continue;
    }

    const attrName = vendor ? `${vendor}:${attr.Name}` : attr.Name;
    if (attributesByName$.map.get()[attrName]) {
      mergeIntoObservable(attributesByName$.map, {
        [attrName]: {
          ...attributesByName$.map.get()[attrName],
          dictionaries: [
            ...attributesByName$.map.get()[attrName].dictionaries,
            dictionaryName,
          ],
        },
      });
    } else {
      mergeIntoObservable(attributesByName$.map, {
        [attrName]: {
          ...attr,
          dictionaries: [dictionaryName],
        },
      });
    }
  }
};

const alreadyHaveValue = (
  have: {
    Name: string;
    Attribute: string;
    Number: number;
    dictionary: string;
    loc?: RadiusAttributeLocation;
  }[],
  val: RadiusDictionaryValue,
): boolean => {
  return have.some((v) => v.Name === val.Name && v.Number === val.Number);
};

const populateValues = (
  dictionaryName: string | undefined,
  values: (RadiusDictionaryValue | null)[],
  vendor?: string,
  loc?: RadiusAttributeLocation,
) => {
  for (const val of values) {
    if (!val) {
      continue;
    }

    const attrName = vendor ? `${vendor}:${val.Attribute}` : val.Attribute;
    const have = valuesByAttribute$.map[attrName].get();
    if (have) {
      if (alreadyHaveValue(have, val)) {
        continue;
      }
      mergeIntoObservable(valuesByAttribute$.map, {
        [attrName]: [
          ...valuesByAttribute$.map[attrName].get(),
          { ...val, dictionary: dictionaryName, loc },
        ],
      });
    } else {
      mergeIntoObservable(valuesByAttribute$.map, {
        [attrName]: [{ ...val, dictionary: dictionaryName, loc }],
      });
    }
  }
};

export type AttributeKey = { attr: string; vendor?: string | null };

export const radiusParamsStore$ = observable({
  uiState: {
    tab: "general" as Tab,
    dynamicTabs: [] as Tab[],
    visibleTabs: [
      "general",
      "mac_addresses",
      "ip_addresses",
      "radius",
      "scheduler",
      "api",
    ] as Tab[],
    showTabs: (tabs: Tab[]) => {
      for (const tab of tabs) {
        if (!radiusParamsStore$.uiState.visibleTabs.includes(tab)) {
          radiusParamsStore$.uiState.visibleTabs.push(tab);
        }
      }
    },
    hideTabs: (tabs: Tab[]) => {
      radiusParamsStore$.uiState.visibleTabs.set(
        radiusParamsStore$.uiState.visibleTabs
          .get()
          .filter((t) => !tabs.includes(t)),
      );
    },
    addDynamicTabs: (tabs: Tab[]) => {
      batch(() => {
        radiusParamsStore$.uiState.dynamicTabs.set(
          radiusParamsStore$.uiState.dynamicTabs.get().concat(tabs),
        );
        radiusParamsStore$.uiState.showTabs(tabs);
      });
    },
    removeDynamicTabs: (tabs?: Tab[]) => {
      if (tabs) {
        beginBatch();
        radiusParamsStore$.uiState.dynamicTabs.set(
          radiusParamsStore$.uiState.dynamicTabs
            .get()
            .filter((t) => !tabs.includes(t)),
        );
        radiusParamsStore$.uiState.hideTabs(tabs);
        endBatch();
      } else {
        beginBatch();
        const dynamicTabs = radiusParamsStore$.uiState.dynamicTabs.get();
        radiusParamsStore$.uiState.dynamicTabs.set([]);
        radiusParamsStore$.uiState.hideTabs(dynamicTabs);
        endBatch();
      }
    },
  },
  radius: {
    load(name: string, data: RadiusDictionaryBody) {
      if (loadedDictionaries$[name].get()) {
        return;
      }

      beginBatch();
      if (data.Attributes) {
        populateAttributes(name, data.Attributes);
      }

      if (data.Values) {
        populateValues(name, data.Values);
      }

      if (data.Vendors) {
        for (const vendor of data.Vendors) {
          if (vendor.Attributes) {
            populateAttributes(name, vendor.Attributes, vendor.Name);
          }

          if (vendor.Values) {
            populateValues(name, vendor.Values, vendor.Name);
          }
        }
      }
      endBatch();

      loadedDictionaries$[name].set(true);
    },
    unload(name: string) {
      loadedDictionaries$[name].delete();

      beginBatch();
      for (const attr of Object.values(attributesByName$.map.get())) {
        attr.dictionaries = attr.dictionaries.filter((d) => d !== name);
        if (attr.dictionaries.length === 0) {
          attributesByName$.map[attr.Name].delete();
        } else {
          attributesByName$.map[attr.Name].assign(attr);
        }
      }

      for (const [attr, val] of Object.entries(valuesByAttribute$.map.get())) {
        const filtered = val.filter((v) => v.dictionary !== name);
        if (filtered.length === 0) {
          valuesByAttribute$.map[attr].delete();
        } else {
          valuesByAttribute$.map[attr].set(filtered);
        }
      }
      endBatch();
    },
    unloadMissing(names: string[]) {
      for (const name in loadedDictionaries$.get()) {
        if (!names.includes(name)) {
          radiusParamsStore$.radius.unload(name);
        }
      }
    },
    byName: (key: AttributeKey) =>
      attributesByName$.map[
        key.vendor ? `${key.vendor}:${key.attr}` : key.attr
      ],
    valuesOf: (key: AttributeKey) =>
      valuesByAttribute$.map[
        key.vendor ? `${key.vendor}:${key.attr}` : key.attr
      ],
    protoSpecific: {
      clear() {
        batch(() => {
          valuesByAttribute$.removeProtoSpecific();
          protoSpecific$.accessRequest.set([]);
          protoSpecific$.accountingStart.set([]);
        });
      },
      updateProtoSpecific(
        loc: RadiusAttributeLocation,
        attrs: ProtoRadiusAttribute[],
      ) {
        if (!equals(protoSpecific$[loc].get(), attrs)) {
          protoSpecific$[loc].set(attrs);
        }

        beginBatch();
        for (const att of attrs) {
          if (!att.custom_values || att.custom_values.length === 0) {
            continue;
          }

          populateValues(
            att.dictionary,
            att.custom_values!.map((a) => ({
              Attribute: att.id,
              Name: a,
              Number: protoSpecificNumber,
            })),
            att.vendor,
            loc,
          );
        }
        endBatch();
      },
      accessRequest: {
        byName: (key: string) =>
          protoSpecific$.accessRequest.find((a) => a.id.get() === key),
        keys: () => protoSpecific$.accessRequest.map((a) => a.id.get()),
        formValues: [] as RadiusForm["radius"]["attributes"]["accessRequest"],
      },
      accountingStart: {
        byName: (key: string) =>
          protoSpecific$.accountingStart.find((a) => a.id.get() === key),
        keys: () => protoSpecific$.accountingStart.map((a) => a.id.get()),
        formValues: [] as RadiusForm["radius"]["attributes"]["accountingStart"],
      },
    },
  },
});

const loadedDictionaries$ = observable({} as Record<string, boolean>);

const attributesByName$ = observable({
  map: {} as Record<
    string,
    RadiusDictionaryAttribute & { dictionaries: string[] }
  >,
});

const valuesByAttribute$ = observable({
  map: {} as Record<
    string,
    (RadiusDictionaryValue & {
      dictionary: string;
      loc?: RadiusAttributeLocation;
    })[]
  >,
  removeProtoSpecific() {
    beginBatch();
    for (const [key, v] of Object.entries(valuesByAttribute$.map.get())) {
      if (v.some((v) => v.Number === protoSpecificNumber)) {
        valuesByAttribute$.map[key].set(
          v.filter((v) => v.Number !== protoSpecificNumber),
        );
      }
    }
    endBatch();
  },
});

const protoSpecific$ = observable({
  accessRequest: [] as ProtoRadiusAttribute[],
  accountingStart: [] as ProtoRadiusAttribute[],
} as Record<RadiusAttributeLocation, ProtoRadiusAttribute[]>);
