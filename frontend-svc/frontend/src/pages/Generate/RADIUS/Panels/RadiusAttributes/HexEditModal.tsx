import { useCallback, useMemo, useRef, useState, type FC } from "react";
import { Button, InputBase, NumberInput, Stack } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import Hex from "hex-encoding";

import { HexEditor } from "@/components/HexEditor";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { toast } from "@/utils/toasts";

export const HexEditModal: FC<{
  cancel: () => void;
  save: (v: Uint8Array) => void;
  data?: string | Uint8Array;
  definitionSize?: number;
}> = ({ cancel, save, data: rawData, definitionSize }) => {
  const [initData, initLinesCount] = useMemo(() => {
    const trueDefinitionSize = definitionSize ?? 0;
    if (typeof rawData === "string") {
      if (!rawData || !Hex.is(rawData)) {
        const d = new Uint8Array(trueDefinitionSize);
        return [d, Math.ceil(d.length / 0x10) + 1];
      }

      const data = Hex.decode(rawData);
      const linesCount = Math.ceil(data.length / 0x10);
      return [data, linesCount];
    }

    return [
      rawData ?? new Uint8Array(trueDefinitionSize),
      Math.ceil(trueDefinitionSize / 0x10) + 1,
    ];
  }, [rawData, definitionSize]);

  const data = useRef(initData);
  const [length, setLength] = useState(initData.length);
  const [linesCount, setLinesCount] = useState(initLinesCount);

  const [nonce, setNonce] = useState(0);
  const handleSetValue = useCallback(
    (offset: number, value: number) => {
      data.current[offset] = value;
      setNonce((v) => v + 1);
    },
    [data],
  );

  const handleLengthChange = useDebouncedCallback((v: number) => {
    if (v < data.current.length) {
      data.current = data.current.slice(0, v);
    } else {
      const newData = new Uint8Array(v);
      newData.set(data.current);
      data.current = newData;
    }
    setLinesCount(Math.ceil(v / 0x10));
    setNonce((v) => v + 1);
  }, 500);

  return (
    <>
      <Stack gap="sm">
        <NumberInput
          label="Length"
          value={length}
          onChange={(v) => {
            if (typeof v !== "number") {
              v = Number.parseInt(v, 10);
            }
            if (isNaN(v) || v < 0) {
              toast.error({ message: "Invalid length" });
              return;
            }
            setLength(v);
            handleLengthChange(v);
          }}
          min={0}
          data-autofocus
        />
        <InputBase
          multiline
          component="div"
          label="Raw data"
          styles={{
            label: { width: "100%" },
            input: { padding: 0 },
          }}
          labelProps={{
            htmlFor: "hex-editor",
          }}
        >
          <HexEditor
            data={data.current}
            nonce={nonce}
            onSetValue={handleSetValue}
            linesCount={linesCount}
            id="hex-editor"
            name="hex-editor"
          />
        </InputBase>
      </Stack>
      <ModalFooter stickyBottom>
        <Button onClick={cancel} variant="default">
          Cancel
        </Button>
        <Button onClick={() => save(data.current)}>Save</Button>
      </ModalFooter>
    </>
  );
};
