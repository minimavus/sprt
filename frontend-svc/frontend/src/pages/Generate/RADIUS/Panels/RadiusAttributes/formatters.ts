import { RadiusDictionaryAttributeType } from "@/hooks/generate/useRadiusDictionaries";

import { RadiusAttributeLocation } from "../../form";

export const attrTypeToString = (
  type: RadiusDictionaryAttributeType,
): string | undefined => {
  switch (type) {
    case RadiusDictionaryAttributeType.AttributeString:
      return "string";
    case RadiusDictionaryAttributeType.AttributeOctets:
      return "octets";
    case RadiusDictionaryAttributeType.AttributeIPAddr:
      return "IP Address";
    case RadiusDictionaryAttributeType.AttributeDate:
      return "date";
    case RadiusDictionaryAttributeType.AttributeInteger:
      return "integer";
    case RadiusDictionaryAttributeType.AttributeIPv6Addr:
      return "IPv6 Address";
    case RadiusDictionaryAttributeType.AttributeIPv6Prefix:
      return "IPv6 Prefix";
    case RadiusDictionaryAttributeType.AttributeIFID:
      return "IFID";
    case RadiusDictionaryAttributeType.AttributeInteger64:
      return "integer64";
    case RadiusDictionaryAttributeType.AttributeVSA:
      return "VSA";
    case RadiusDictionaryAttributeType.AttributeEther:
      return "Ether";
    case RadiusDictionaryAttributeType.AttributeABinary:
      return "ABinary";
    case RadiusDictionaryAttributeType.AttributeByte:
      return "byte";
    case RadiusDictionaryAttributeType.AttributeShort:
      return "short";
    case RadiusDictionaryAttributeType.AttributeSigned:
      return "signed";
    case RadiusDictionaryAttributeType.AttributeTLV:
      return "TLV";
    case RadiusDictionaryAttributeType.AttributeIPv4Prefix:
      return "IPv4 Prefix";
    default:
      return undefined;
  }
};

export type Item = {
  label: string;
  value: string;
  description?: string;
  loc?: RadiusAttributeLocation;
};

export const attrValuesToItems = (
  values: {
    Name: string;
    Number: number;
    Attribute: string;
    dictionary: string;
    loc?: RadiusAttributeLocation;
  }[],
): Item[] => {
  return values.map((value) => ({
    label:
      typeof value.Number !== "undefined" &&
      value.Number !== null &&
      value.Number >= 0
        ? `${value.Name} (${value.Number})`
        : value.Name,
    value: value.Name,
    description: value.Attribute,
    loc: value.loc,
  }));
};
