import { use$ } from "@legendapp/state/react";
import { Input, TextInput } from "@mantine/core";
import { type FC, use } from "react";

import { TransferSideContext } from "./context";
import classes from "./TransferList.module.scss";

export const Search: FC = () => {
  const { state, combobox } = use(TransferSideContext);
  const value = use$(state.search);

  return (
    <TextInput
      placeholder="Search..."
      classNames={{ input: classes.input, root: classes.inputRoot }}
      value={value}
      onChange={(event) => {
        state.search.set(event.currentTarget.value);
        combobox.updateSelectedOptionIndex();
      }}
      rightSection={
        value ? (
          <Input.ClearButton onClick={() => state.search.set("")} />
        ) : undefined
      }
    />
  );
};
