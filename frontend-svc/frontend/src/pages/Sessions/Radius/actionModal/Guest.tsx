import { Button, Card, Code, Stack, Text, Title } from "@mantine/core";
import type { QueryKey } from "@tanstack/react-query";
import type { FC } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { DisplayError } from "@/components/Error";
import { KeyValue } from "@/components/KeyValue";
import { DefaultLoaderFallback } from "@/components/Loader";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { useGetQuery } from "@/hooks/useGetQuery";
import { useQueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import { orMe } from "@/utils/orMe";

import type { ActionModalProps } from ".";
import { mapSelectedToIDs } from "./mapSelectedToIDs";
import type { ActionModal } from "./types";

const guestDataSchema = z.object({
  creds: z.array(
    z.object({
      id: z.number(),
      login: z.string().optional(),
      password: z.string().optional(),
      user_agent: z.string().optional(),
    }),
  ),
  errors: z
    .array(
      z.object({
        id: z.number(),
        err: z.string(),
      }),
    )
    .optional(),
});

type GuestData = z.infer<typeof guestDataSchema>;

const getGuestDataKey = (
  server: string,
  user: string,
  bulk: string,
  payload: any,
): QueryKey =>
  [
    "sessions",
    user,
    server,
    { proto: "radius", bulk },
    "guest-data",
    payload,
  ] as const;

const useGuestData = (payload: ActionModalProps<"guest">["payload"]) => {
  const { server, bulk } = useParams<{ server: string; bulk: string }>();
  const [user] = useQueryUser();

  return useGetQuery({
    url: api.v2`sessions/radius/${server || "~"}/${bulk || "~"}/guest-data`,
    queryKey:
      server && bulk
        ? getGuestDataKey(server, orMe(user), bulk, payload)
        : undefined,
    schema: guestDataSchema,
    params: { ...payload, user },
  });
};

const Credentials: FC<{ creds: GuestData["creds"] }> = ({ creds }) => {
  return creds.length > 1 ? (
    <>
      <Title order={5}>Credentials</Title>
      <Code block>
        {creds.map((c) => c.login + ":" + c.password).join("\n")}
      </Code>
    </>
  ) : (
    <KeyValue
      pairs={[
        ["Login", creds[0].login || "No login found"],
        ["Password", creds[0].password || "No password found"],
        ["User Agent", creds[0].user_agent || "No user agent found"],
      ]}
    />
  );
};

export const Guest: ActionModal<"guest"> = ({
  onClose,
  payload,
  selected,
  sessions,
}) => {
  const ids = mapSelectedToIDs<"guest">(payload, selected, sessions);
  const {
    data: guestData,
    status,
    error,
  } = useGuestData(ids ? { ...payload, sessions: ids } : undefined);

  return (
    <Stack gap="sm">
      {status === "pending" ? (
        <DefaultLoaderFallback />
      ) : status === "error" ? (
        <DisplayError error={error} />
      ) : (
        <Card withBorder shadow="none">
          {guestData?.creds?.length > 0 ? (
            <Credentials creds={guestData.creds} />
          ) : (
            <Text>No guest data found</Text>
          )}
        </Card>
      )}
      <ModalFooter>
        <Button onClick={onClose as any}>OK</Button>
      </ModalFooter>
    </Stack>
  );
};

Guest.modalTitle = "Guest data";
