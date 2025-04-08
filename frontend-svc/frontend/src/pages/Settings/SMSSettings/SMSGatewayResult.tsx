import { FC, RefObject, useMemo } from "react";
import {
  Checkbox,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { Info } from "@/components/Alerts";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { useHostName } from "@/hooks/settings/global";
import { useQueryUser } from "@/hooks/useQueryUser";
import { useUser } from "@/hooks/useUser";

import { SMSGatewayConfigRef } from "./types";
import { getURLPrefix } from "./utils";

export const SMSGatewayResult: FC<{
  formRef: RefObject<SMSGatewayConfigRef | null>;
  active: boolean;
}> = ({ formRef, active }) => {
  const [showHttps, { toggle }] = useDisclosure();

  const v = useMemo(() => {
    if (!formRef.current) return null;
    return formRef.current.getValues();
  }, [active]);

  const { data: hostName } = useHostName();
  const [user] = useQueryUser();
  const { data: userData } = useUser();

  const [host, port] = useMemo(() => {
    if (!hostName) return ["", "443"];
    const [host, port] = hostName.replace(/^\/\//, "").split(":");
    return [host, port ?? "443"];
  }, [hostName]);

  const url = `${showHttps ? "https:" : "http:"}//${getURLPrefix(hostName!, user ?? userData?.UserID)}${v?.url}`;

  return (
    <Stack gap="sm">
      <div>
        <Title order={3}>Result</Title>
        <Text size="xs" component="span">
          What should be configured on ISE
        </Text>
      </div>
      {!formRef.current?.isSaved() ? (
        <Info>Don't forget to save configuration</Info>
      ) : null}
      <Switch
        checked={showHttps}
        onChange={toggle}
        label="Show HTTPS configuration"
      />
      <TextInput
        label="URL"
        value={url}
        readOnly
        rightSection={<CopyToClipboard value={url} tooltipPosition="top" />}
      />
      <div style={{ position: "relative" }}>
        <Textarea
          label="Data (Url encoded portion):"
          value={v?.method === "post" ? v?.body : "$message$"}
          readOnly
          minRows={3}
          maxRows={6}
          autosize
        />
      </div>
      <Checkbox
        label="Use HTTP POST method for data portion"
        checked={v?.method === "post"}
        readOnly
      />
      <TextInput
        label="HTTP POST data content type:"
        value={v?.method === "post" ? v?.contentType : ""}
        readOnly
        rightSection={
          v?.method === "post" ? (
            <CopyToClipboard
              value={v?.contentType || ""}
              tooltipPosition="top"
            />
          ) : undefined
        }
      />
      <TextInput
        label="HTTPS Username:"
        value={v?.requireAuth ? v?.auth?.username : ""}
        readOnly
        rightSection={
          v?.requireAuth ? (
            <CopyToClipboard value={v?.auth?.username} tooltipPosition="top" />
          ) : undefined
        }
      />
      <TextInput
        label="HTTPS Password:"
        value={v?.requireAuth ? v?.auth?.password : ""}
        readOnly
        rightSection={
          v?.requireAuth ? (
            <CopyToClipboard value={v?.auth?.password} tooltipPosition="top" />
          ) : undefined
        }
      />
      <TextInput label="HTTPS Host:" value={showHttps ? host : ""} readOnly />
      <TextInput
        label="HTTPS Port:"
        value={showHttps ? port : "443"}
        readOnly
      />
      <Checkbox
        label="Break up long message into multiple parts (140 byte chunks)"
        checked={false}
        readOnly
      />
    </Stack>
  );
};
