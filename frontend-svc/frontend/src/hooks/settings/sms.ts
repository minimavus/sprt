import {
  DefaultError,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod/v4";

import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { orMe } from "@/utils/orMe";
import { toast } from "@/utils/toasts";

import { useGetQuery } from "../useGetQuery";
import { QueryUser } from "../useQueryUser";

const getSMSGatewaySettingsKey = (user: string): QueryKey => [
  "settings",
  "sms-gateway",
  { user },
];

const SMSGatewaySettingsSchema = z
  .object({
    method: z.enum(["get", "post"]),
    password: z.string().nullish(),
    username: z.string().nullish(),
    basic_auth: z.coerce.number(),
    url_postfix: z.string(),
    content_type: z.string(),
    body_template: z.string(),
    message_template: z.string(),
  })
  .nullish();

export type SMSGatewaySettings = z.infer<typeof SMSGatewaySettingsSchema>;

export const useSMSGatewaySettings = (user: QueryUser) => {
  return useGetQuery({
    queryKey: getSMSGatewaySettingsKey(orMe(user)),
    url: api.v2`settings/sms-gateway`,
    params: { user },
    schema: SMSGatewaySettingsSchema,
  });
};

export const useSMSGatewaySettingsUpdate = (user: QueryUser) => {
  const qc = useQueryClient();
  return useMutation<{ affected: number }, DefaultError, SMSGatewaySettings>({
    mutationFn: async (values) => {
      return (
        await axios.put(api.v2`settings/sms-gateway`, values, {
          params: { user },
        })
      ).data;
    },
    onError: (error) => {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
      qc.invalidateQueries({
        queryKey: getSMSGatewaySettingsKey(orMe(user)),
      }).catch(log.error);
    },
    onSuccess: () => {
      toast.success({
        title: "Updated",
        message: `SMS Gateway settings updated`,
      });
      qc.invalidateQueries({
        queryKey: getSMSGatewaySettingsKey(orMe(user)),
      }).catch(log.error);
    },
  });
};

const SMSGatewaySettingsResponseValueSchema = z.object({
  url: z.string(),
  method: z.enum(["get", "post"]),
  message_template: z.string(),
  content_type: z.string(),
  body_template: z.string().optional().default(""),
});

export type SMSGatewaySettingsResponseValue = z.infer<
  typeof SMSGatewaySettingsResponseValueSchema
>;

const SMSGatewayExamplesResponseSchema = z.array(
  z.object({
    title: z.string(),
    value: SMSGatewaySettingsResponseValueSchema,
  }),
);

export function useSMSGatewayExamples() {
  return useGetQuery({
    queryKey: ["settings", "sms-gateway", "examples"],
    url: api.v2`settings/sms-gateway/examples`,
    schema: SMSGatewayExamplesResponseSchema,
  });
}
