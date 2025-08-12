import { use$ } from "@legendapp/state/react";
import { Checkbox, Combobox } from "@mantine/core";
import { type FC, use } from "react";

import { TransferSideContext } from "./context";
import type { TransferTreeDatum } from "./types";

export const RenderItem: FC<{ itemKey: string; datum: TransferTreeDatum }> = ({
  itemKey: key,
  datum,
}) => {
  const { state, combobox, visibility } = use(TransferSideContext);

  const checked = use$(state.selected[key]);
  const visible = use$(visibility.isVisible(key));

  if (!visible) {
    return null;
  }

  return (
    <Combobox.Option
      value={key}
      key={key}
      active={checked || false}
      onMouseOver={() => combobox.resetSelectedOption()}
    >
      <Checkbox
        checked={checked || false}
        onChange={() => void 0}
        aria-hidden
        tabIndex={-1}
        label={datum.label}
        style={{ pointerEvents: "none" }}
      />
    </Combobox.Option>
  );
};
