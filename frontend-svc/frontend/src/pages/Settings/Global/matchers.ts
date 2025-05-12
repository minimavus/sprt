import ipaddr from "ipaddr.js";

type matcher = (value: string) => boolean;

export const buildRegexMatcher = (pattern: string): matcher => {
  const regex = new RegExp(pattern);
  return (value: string) => regex.test(value);
};

export const buildIPMatcher = (pattern: string): matcher => {
  const ip = ipaddr.parse(pattern);
  return (value: string) => {
    try {
      const addr = ipaddr.parse(value);
      if (ip.kind() !== addr.kind()) {
        return false;
      }
      if (ip.kind() === "ipv4") {
        return ip.match(addr, 32);
      }
      return ip.match(addr, 128);
    } catch (e) {
      return false;
    }
  };
};
