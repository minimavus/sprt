import { ComboboxItem } from "@mantine/core";

const patterns: ComboboxItem[] = [
  {
    value: "10.0.0.0/8",
    label: "10.0.0.0/8",
  },
  {
    value: "172.16.0.0/12",
    label: "172.16.0.0/12",
  },
  {
    value: "192.168.0.0/16",
    label: "192.168.0.0/16",
  },
  {
    value: "10.10.0.0 - 10.10.255.255",
    label: "10.10.0.0 - 10.10.255.255",
  },
  {
    value: "192.168.10.1 - 192.168.10.254",
    label: "192.168.10.1 - 192.168.10.254",
  },
];

export const useIPAddressesRanges = () => {
  //FIXME: this is a temporary solution, we need to get the IP address ranges from the server
  return patterns;
};
