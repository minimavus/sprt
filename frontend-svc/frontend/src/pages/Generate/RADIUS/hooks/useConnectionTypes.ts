import { ComboboxData } from "@mantine/core";

const connectionTypes = [
  {
    group: "Most Common",
    items: [
      { label: "Wireless (802.11)", value: "Wireless-802.11" },
      { label: "Wired (Ethernet)", value: "Ethernet" },
    ],
  },
  {
    group: "Others",
    items: [
      { label: "Async", value: "Async" },
      { label: "Sync", value: "Sync" },
      { label: "ISDN", value: "ISDN" },
      { label: "ISDN-V120", value: "ISDN-V120" },
      { label: "ISDN-V110", value: "ISDN-V110" },
      { label: "Virtual", value: "Virtual" },
      { label: "PIAFS", value: "PIAFS" },
      { label: "HDLC-Clear-Channel", value: "HDLC-Clear-Channel" },
      { label: "X.25", value: "X.25" },
      { label: "X.75", value: "X.75" },
      { label: "G.3-Fax", value: "G.3-Fax" },
      { label: "SDSL", value: "SDSL" },
      { label: "ADSL-CAP", value: "ADSL-CAP" },
      { label: "ADSL-DMT", value: "ADSL-DMT" },
      { label: "IDSL", value: "IDSL" },
      { label: "xDSL", value: "xDSL" },
      { label: "Cable", value: "Cable" },
      { label: "Wireless-Other", value: "Wireless-Other" },
      { label: "Token-Ring", value: "Token-Ring" },
      { label: "FDDI", value: "FDDI" },
    ],
  },
];

export const useConnectionTypes = (): ComboboxData => {
  return connectionTypes;
};
