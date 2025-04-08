import { NewServer } from "@/hooks/settings/servers";

export const emptyServer = (): NewServer => ({
  acct_port: 1813,
  address: "",
  attributes: {
    dns: "",
    radius: true,
    shared: "",
    tacacs: false,
    tac: { ports: [49], shared: "" },
    no_session_action: "coa-nak",
    coa_nak_err_cause: "503",
    no_session_dm_action: "disconnect-nak",
    dm_err_cause: "503",
  },
  auth_port: 1812,
  coa: false,
  group: "",
  owner: "",
});
