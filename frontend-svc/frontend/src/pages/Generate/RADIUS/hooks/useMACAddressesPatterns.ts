import { ComboboxItem } from "@mantine/core";

const patterns: ComboboxItem[] = [
  {
    value: "00:09:43:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "00:09:43 Cisco Systems, Inc.",
  },
  {
    value: "00:0B:CD:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "00:0B:CD Hewlett-Packard",
  },
  {
    value: "00:0B:DB:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "00:0B:DB Dell",
  },
  {
    value: "14:8F:C6:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "14:8F:C6 Apple",
  },
  {
    value: "A4:8C:DB:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "A4:8C:DB Lenovo",
  },
  { value: "", label: "--divider--" },
  {
    value:
      "[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}:[A-F0-9]{2}",
    label: "Random",
  },
];

export const useMACAddressesPatterns = () => {
  return patterns;
};
