import type { SMSSettingsFormData } from "./schema";

export type SMSSettingsTabs = "config" | "result";

export type SMSGatewayConfigRef = {
  isSaved(): boolean;
  getValues(): SMSSettingsFormData;
};
