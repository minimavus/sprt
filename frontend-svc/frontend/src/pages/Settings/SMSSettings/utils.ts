import { SMSGatewaySettings } from "@/hooks/settings/sms";

import { SMSSettingsFormData } from "./schema";

export const getURLPrefix = (
  hostName: string,
  user: string | null | undefined,
) => {
  return `${hostName}/sms/${user}/`;
};

export const serverDataToFormValues = (
  data: NonNullable<SMSGatewaySettings>,
): SMSSettingsFormData => ({
  method: data.method,
  url: data.url_postfix,
  body: data.body_template,
  messageTemplate: data.message_template,
  contentType: data.content_type,
  requireAuth: Boolean(data.basic_auth),
  auth: {
    username: data.username ?? "",
    password: data.password ?? "",
  },
});

export const formValuesToServerData = (
  values: SMSSettingsFormData,
): SMSGatewaySettings => ({
  method: values.method,
  url_postfix: values.url,
  body_template: values.body,
  message_template: values.messageTemplate,
  content_type: values.contentType,
  basic_auth: values.requireAuth ? 1 : 0,
  ...(values.requireAuth
    ? {
        username: values.auth?.username ?? "",
        password: values.auth?.password ?? "",
      }
    : { username: "", password: "" }),
});
