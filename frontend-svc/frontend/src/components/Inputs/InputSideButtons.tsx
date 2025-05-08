import {
  createContext,
  use,
  useCallback,
  useEffect,
  type Dispatch,
  type FC,
  type RefObject,
  type SetStateAction,
} from "react";
import { Button, Menu } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";

import type { InputSideButton } from "@/hooks/generate/schemas";
import { log } from "@/utils/log";

type InputSideButtonsContextValue = {
  setButtonsWidth: Dispatch<SetStateAction<number>>;
};

export const InputSideButtonsContext =
  createContext<InputSideButtonsContextValue>(
    {} as InputSideButtonsContextValue,
  );

const DropdownButton: FC<{
  button: InputSideButton;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}> = ({ button, onChange, inputRef }) => {
  const [opened, { close, open }] = useDisclosure();

  const handleItemValue = useCallback(
    (value: string) => {
      if (inputRef.current) {
        const start = Math.min(
          inputRef.current.selectionStart ?? inputRef.current.value.length,
          inputRef.current.selectionEnd ?? inputRef.current.value.length,
          inputRef.current.value.length,
        );
        const end = inputRef.current.selectionEnd
          ? Math.max(
              inputRef.current.selectionStart ?? inputRef.current.value.length,
              inputRef.current.selectionEnd ?? inputRef.current.value.length,
              inputRef.current.value.length,
            )
          : start;

        if (start !== end) {
          // Replace selected text with the value
          onChange(
            inputRef.current.value.slice(0, start) +
              value +
              inputRef.current.value.slice(end),
          );
        } else {
          // Insert value at the cursor
          onChange(
            inputRef.current.value.slice(0, start) +
              value +
              inputRef.current.value.slice(start),
          );
        }
      }
    },
    [onChange, inputRef],
  );

  return (
    <Menu onClose={close} onOpen={open}>
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          rightSection={
            <IconChevronDown
              size={14}
              style={{
                transform: opened ? "rotate(-180deg)" : "none",
              }}
            />
          }
        >
          {button.title}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {button.values?.map((v) =>
          v.type === "group" ? (
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>{v.title}</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                {v.values.map((v) => (
                  <Menu.Item
                    key={v.title}
                    onClick={() => handleItemValue(v.value)}
                  >
                    {v.title}
                  </Menu.Item>
                ))}
              </Menu.Sub.Dropdown>
            </Menu.Sub>
          ) : v.type === "value" ? (
            <Menu.Item onClick={() => handleItemValue(v.value)}>
              {v.title}
            </Menu.Item>
          ) : null,
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export const InputSideButtons: FC<{
  buttons: InputSideButton[] | undefined;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}> = ({ buttons, onChange, inputRef }) => {
  const { ref: groupRef, width } = useElementSize();
  const { setButtonsWidth } = use(InputSideButtonsContext);

  useEffect(() => {
    setButtonsWidth(width ? width + 12 : 0);
    return () => setButtonsWidth(0);
  }, [width]);

  if (!buttons?.length) {
    return null;
  }

  return (
    <Button.Group ref={groupRef}>
      {buttons.map((button, index) => {
        if (button.type !== "dropdown") {
          log.warn("Only dropdown buttons are supported at the moment", button);
          return null;
        }

        return (
          <DropdownButton
            key={index}
            button={button}
            onChange={onChange}
            inputRef={inputRef}
          />
        );
      })}
    </Button.Group>
  );
};
