import { useMemo, type FC } from "react";
import { CodeHighlight } from "@mantine/code-highlight";
import { Paper } from "@mantine/core";
import { useFormContext } from "react-hook-form";

import { DisplayError } from "@/components/Error";

import { useFormSchema } from "../formStateContext";

export const APIParameters: FC<{ visible: boolean }> = ({ visible }) => {
  const schema$ = useFormSchema();
  const { getValues, trigger, clearErrors } = useFormContext();

  const parsed = useMemo(() => {
    if (!visible) return null;
    const values = getValues();
    const p = schema$.get().safeParse(values);
    if (!p.success) {
      trigger();
    } else {
      clearErrors();
    }
    return p;
  }, [visible, schema$, getValues]);

  if (!parsed) return <></>;

  if (!parsed.success) {
    return (
      <DisplayError error={parsed.error} before="Some fields are invalid" />
    );
  }

  return (
    <Paper w="100%" style={{ overflow: "auto" }}>
      <CodeHighlight
        language="json"
        code={JSON.stringify(parsed.data)}
        style={{ wordBreak: "break-all", whiteSpace: "wrap", maxWidth: "100%" }}
        styles={{
          code: {
            wordBreak: "break-all",
            whiteSpace: "break-spaces",
          },
        }}
      />
    </Paper>
  );
};
