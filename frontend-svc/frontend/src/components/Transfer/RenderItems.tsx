import { FC, use } from "react";
import { use$ } from "@legendapp/state/react";
import {
  ActionIcon,
  Checkbox,
  Collapse,
  Combobox,
  Group,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";

import { TransferSideContext } from "./context";
import { RenderItem } from "./RenderItem";
import {
  isSortedCategoryDatum,
  SortedTransferTreeCategoryValues,
  SortedTransferTreeData,
} from "./utils";

const RenderCategory: FC<{
  categoryKey: string;
  datum: SortedTransferTreeCategoryValues;
}> = ({ categoryKey: key, datum }) => {
  const { state, combobox, visibility } = use(TransferSideContext);
  const [opened, { toggle }] = useDisclosure(true);

  const { checked, indeterminate, visible } = use$(() => {
    const checked =
      datum.values.every(([key]) => state.selected[key].get()) || false;
    const indeterminate =
      !checked && datum.values.some(([key]) => state.selected[key].get());
    const visible =
      visibility.isVisible(key) ||
      datum.values.some(([key]) => visibility.isVisible(key));
    return { checked, indeterminate, visible };
  });

  if (!visible) {
    return null;
  }

  return (
    <>
      <Combobox.Option
        value={key}
        key={key}
        active={checked}
        onMouseOver={() => combobox.resetSelectedOption()}
      >
        <Group gap="xs" justify="space-between">
          <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={() => void 0}
            aria-hidden
            tabIndex={-1}
            label={datum.label}
            style={{ pointerEvents: "none" }}
          />
          <ActionIcon
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            <IconChevronDown
              size={14}
              style={{ transform: opened ? "rotate(-180deg)" : "none" }}
            />
          </ActionIcon>
        </Group>
      </Combobox.Option>
      <Collapse in={opened}>
        <Stack gap={0} pl="xl">
          <RenderItems data={datum.values} />
        </Stack>
      </Collapse>
    </>
  );
};

export const RenderItems: FC<{ data: SortedTransferTreeData }> = ({ data }) => {
  return data.map(([key, datum]) => {
    if (isSortedCategoryDatum(datum)) {
      return <RenderCategory key={key} categoryKey={key} datum={datum} />;
    }

    return <RenderItem key={key} itemKey={key} datum={datum} />;
  });
};
