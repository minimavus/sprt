import { useEffect, useMemo, type FC } from "react";
import { Badge, Stack, Title } from "@mantine/core";
import { useController, useWatch } from "react-hook-form";

import { Info } from "@/components/Alerts";
import {
  DrawerSelect,
  type DrawerSelectOptionGroup,
} from "@/components/Inputs/DrawerSelect";
import {
  useRadiusDictionaries,
  useRadiusDictionaryBulk,
  type RadiusDictionary,
} from "@/hooks/generate/useRadiusDictionaries";
import { useDictionariesOfType } from "@/hooks/settings/dictionaries";
import { useErrorNotification } from "@/hooks/useErrorNotification";
import { useQueryUser } from "@/hooks/useQueryUser";

import type { RadiusForm } from "../form";
import { radiusParamsStore$ } from "../store";

const useLoader = () => {
  const [u] = useQueryUser();
  const selected = useWatch<RadiusForm, "radius.dictionaries">({
    name: "radius.dictionaries",
  });

  const { data, isError } = useRadiusDictionaryBulk(selected, u);
  useErrorNotification({
    isError,
    title: "Error",
    description: "Failed to load dictionaries",
  });

  useEffect(() => {
    for (const [name, d] of data.entries()) {
      radiusParamsStore$.radius.load(name, d);
    }
    radiusParamsStore$.radius.unloadMissing(Array.from(data.keys()));
  }, [data]);
};

const DictionaryLabel: FC<{
  dict: PartialBy<RadiusDictionary, "file" | "vendors">;
  isCustom?: boolean;
}> = ({ dict, isCustom }) => {
  return (
    <>
      {dict.name} {dict.vendors?.length ? `(${dict.vendors.join(", ")})` : ""}
      {isCustom ? (
        <Badge color="cyan" variant="outline" size="sm">
          Custom
        </Badge>
      ) : null}
    </>
  );
};

export const RadiusDictionaries: FC = () => {
  const [u] = useQueryUser();
  const { data } = useRadiusDictionaries(u);
  const { data: customDictionaries } = useDictionariesOfType("radius", true, u);

  useLoader();

  const { field: dictsController } = useController<
    RadiusForm,
    "radius.dictionaries"
  >({
    name: "radius.dictionaries",
  });

  const options: DrawerSelectOptionGroup[] = useMemo(() => {
    if (!data && !customDictionaries) return [];

    const combined: DrawerSelectOptionGroup[] = [];
    if (data) {
      combined.push(
        ...data.sorted.map(([letter, dicts]) => ({
          label: letter,
          options: dicts.map((dict) => ({
            value: dict.file,
            label: <DictionaryLabel dict={dict} />,
          })),
        })),
      );
    }

    if (customDictionaries) {
      for (const dict of customDictionaries) {
        const letter = dict.name[0].toUpperCase();
        const group = combined.find((g) => g.label === letter);
        if (group) {
          group.options.push({
            value: dict.id,
            label: (
              <DictionaryLabel
                dict={{ name: dict.name }}
                isCustom={!dict.is_global}
              />
            ),
          });
        } else {
          combined.push({
            label: letter,
            options: [
              {
                value: dict.id,
                label: (
                  <DictionaryLabel
                    dict={{ name: dict.name }}
                    isCustom={!dict.is_global}
                  />
                ),
              },
            ],
          });
        }
      }
    }

    return combined.sort((a, b) =>
      (a.label as string)!.localeCompare(b.label as string),
    );
  }, [data, customDictionaries]);

  return (
    <Stack gap="sm">
      <Title order={3}>Dictionaries</Title>
      <Info>Select which RADIUS dictionaries will be loaded</Info>
      <DrawerSelect
        options={options}
        label="Select"
        singular="dictionary"
        plural="dictionaries"
        value={dictsController.value}
        onChange={dictsController.onChange}
      />
    </Stack>
  );
};
