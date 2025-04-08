import ipaddr from "ipaddr.js";

type isIPProps = {
  allowEmpty?: boolean;
  allowUndef?: boolean;
  allowNull?: boolean;
  version?: "v4" | "v6";
};

export const isIP =
  ({
    allowEmpty = false,
    allowNull = false,
    allowUndef = false,
    version,
  }: isIPProps = {}) =>
  (v: unknown): boolean => {
    if (allowUndef && v === undefined) return true;
    if (allowEmpty && v === "") return true;
    if (allowNull && v === null) return true;

    try {
      const i = ipaddr.parse(v as any);
      if (version === "v4") return i.kind() === "ipv4";
      if (version === "v6") return i.kind() === "ipv6";
      return true;
    } catch (e) {
      return false;
    }
  };
