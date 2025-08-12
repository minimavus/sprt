import { use$, useObservable } from "@legendapp/state/react";
import { ActionIcon, Combobox, Group, useCombobox } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { type FC, useCallback } from "react";

import { TransferSideContext } from "./context";
import { RenderItems } from "./RenderItems";
import classes from "./TransferList.module.scss";
import { Search } from "./TransferSearch";
import type {
  TransferSide,
  TransferSideState,
  TransferToBeTransferred,
  TransferTreeData,
} from "./types";
import { isCategoryDatum, sortData } from "./utils";

interface RenderListProps {
  options: TransferTreeData;
  onTransfer: (options: TransferToBeTransferred) => void;
  type: TransferSide;
  sortKeys: boolean;
}

function RenderList({
  options: optionsFromProps,
  onTransfer,
  type,
  sortKeys,
}: RenderListProps) {
  const combobox = useCombobox();

  const state$: TransferSideState["state"] = useObservable(
    {
      selected: {} as Record<string, boolean>,
      search: "",
      options: optionsFromProps,
      sortKeys: sortKeys,
    },
    [optionsFromProps],
  );

  const visibilityState$ = useObservable({
    visibleKeys: () => {
      const search = state$.search.get().toLowerCase();
      if (!search) {
        return null;
      }

      const keys = new Set<string>();
      const searchLower = search.toLowerCase();
      for (const [key, datum] of Object.entries(state$.options.get())) {
        if (datum.label.toLowerCase().includes(searchLower)) {
          keys.add(key);
        }
        if (isCategoryDatum(datum)) {
          for (const [valueKey, valueDatum] of Object.entries(datum.values)) {
            if (valueDatum.label.toLowerCase().includes(searchLower)) {
              keys.add(valueKey);
            }
          }
        }
      }

      return keys;
    },
    isVisible: (key: string) => {
      if (!state$.search.get()) {
        return true;
      }
      const visibleKeys = visibilityState$.visibleKeys.get();
      return !visibleKeys || visibleKeys.has(key);
    },
  });

  const handleValueSelect = useCallback(
    (val: string) => {
      if (
        val in state$.options.get() &&
        isCategoryDatum(state$.options[val].get())
      ) {
        const values = Object.keys(state$.options[val].get().values!);
        const allSelected = values.every((key) => state$.selected[key].get());
        const noneSelected = values.every((key) => !state$.selected[key].get());

        if (allSelected || noneSelected) {
          state$.selected.assign(
            values.reduce(
              (acc, key) => {
                acc[key] = !allSelected;
                return acc;
              },
              {} as Record<string, boolean>,
            ),
          );
        } else {
          state$.selected.assign(
            values.reduce(
              (acc, key) => {
                acc[key] = true;
                return acc;
              },
              {} as Record<string, boolean>,
            ),
          );
        }
      } else {
        state$.selected.assign({
          [val]: !(state$.selected[val].get() || false),
        });
      }
    },
    [state$],
  );

  const handleTransfer = useCallback(() => {
    const selected = {} as TransferToBeTransferred;

    for (const key in state$.selected.get()) {
      if (!state$.selected[key].get()) {
        continue;
      }

      const category = Object.entries(state$.options.get()).find(
        ([k, datum]) => {
          if (isCategoryDatum(datum)) {
            return key in datum.values;
          }
          return key === k;
        },
      )?.[0];

      if (!category) {
        continue;
      }

      if (!selected[category]) {
        selected[category] = new Set();
      }

      selected[category].add(key);
    }

    onTransfer(selected);
    state$.selected.set({});
  }, [state$, onTransfer]);

  const visibleKeys = use$(visibilityState$.visibleKeys);
  const options = use$(() =>
    sortData(state$.options.get(), state$.sortKeys.get()),
  );

  return (
    <TransferSideContext
      value={{ state: state$, combobox, visibility: visibilityState$ }}
    >
      <div data-type={type} className={classes.listContainer}>
        <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
          <Combobox.EventsTarget>
            <Group wrap="nowrap" gap={0} className={classes.controls}>
              <Search />
              <ActionIcon
                radius={0}
                variant="default"
                size={36}
                className={classes.control}
                onClick={handleTransfer}
              >
                <IconChevronRight className={classes.icon} />
              </ActionIcon>
            </Group>
          </Combobox.EventsTarget>

          <div className={classes.list}>
            <Combobox.Options>
              {Object.keys(options).length > 0 &&
              (!visibleKeys || visibleKeys.size > 0) ? (
                <RenderItems data={options} />
              ) : (
                <Combobox.Empty>Nothing found....</Combobox.Empty>
              )}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>
    </TransferSideContext>
  );
}

interface TransferListProps {
  source: TransferTreeData;
  target: TransferTreeData;
  onTransfer: (
    transferFrom: TransferSide,
    toTransfer: TransferToBeTransferred,
  ) => void;
  sortKeys?: boolean;
}

export const TransferList: FC<TransferListProps> = ({
  source,
  target,
  onTransfer,
  sortKeys = false,
}) => {
  return (
    <div className={classes.root}>
      <RenderList
        type="source"
        options={source}
        onTransfer={(options) => onTransfer("source", options)}
        sortKeys={sortKeys}
      />
      <RenderList
        type="target"
        options={target}
        onTransfer={(options) => onTransfer("target", options)}
        sortKeys={sortKeys}
      />
    </div>
  );
};
