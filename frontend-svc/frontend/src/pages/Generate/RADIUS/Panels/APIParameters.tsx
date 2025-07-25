import { CodeHighlight } from "@mantine/code-highlight";
import { Paper } from "@mantine/core";
import { type ComponentProps, type FC, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { Warning } from "@/components/Alerts";
import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useAPISettings } from "@/hooks/settings/api";
import { useQueryUser } from "@/hooks/useQueryUser";

import { cleanupRadiusAttributes } from "../form";
import { useFormSchema } from "../formStateContext";
import { useNadFamily } from "../hooks/useNadFamily";

const APIParameters: FC<{ visible: boolean }> = ({ visible }) => {
  const schema$ = useFormSchema();
  const { getValues, trigger, clearErrors } = useFormContext();

  const [u] = useQueryUser();
  const nadFamily = useNadFamily(u);

  const parsed = useMemo(() => {
    if (!visible) return null;
    const values = getValues();
    const p = schema$.get().safeParse(values);
    if (!p.success) {
      trigger();
    } else {
      clearErrors();
    }
    if (p.success) {
      const cleaned = cleanupRadiusAttributes(p.data, nadFamily);
      return { ...p, data: cleaned };
    }
    return p;
  }, [visible, schema$, getValues, nadFamily]);

  if (!parsed) return <></>;

  if (!parsed.success) {
    return (
      <DisplayError
        error="Some fields are invalid"
        before="Cannot generate API example:"
      />
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

const APIEnabledWrapper: FC<ComponentProps<typeof APIParameters>> = (props) => {
  const [u] = useQueryUser();
  const { data, status, error } = useAPISettings(u);

  if (status === "pending") return <DefaultLoaderFallback />;
  if (status === "error") {
    return <DisplayError error={error} before="Cannot load API settings" />;
  }

  if (!data?.token) {
    return (
      <Warning>
        API access is disabled, please enable it in the settings first
      </Warning>
    );
  }

  return <APIParameters {...props} />;
};

export { APIEnabledWrapper as APIParameters };
