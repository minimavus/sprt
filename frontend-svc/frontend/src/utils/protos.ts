export const protoNames = new Map([
  ["mab", "MAB"],
  ["pap-chap", "PAP/CHAP"],
  ["peap", "PEAP"],
  ["eap-tls", "EAP-TLS"],
  ["tacacs", "TACACS+"],
]);

export const radiusProtos = ["mab", "pap-chap", "peap", "eap-tls"];
const allRadiusProtos = new Set([...radiusProtos, "pap", "chap"]);

export const isRadiusProto = (proto: string): boolean =>
  allRadiusProtos.has(proto);
