import { SessionFlow, TacacsPacket } from "@/hooks/sessions/schemas";

export const isTacacsPacket = (
  packet: SessionFlow["packets"][number]["radius"]["packet"],
): packet is TacacsPacket => {
  if (!packet) {
    return false;
  }

  return "body" in packet;
};

export const isNonEmptyPacket = (
  packet: TacacsPacket,
): packet is DeepNonNullable<TacacsPacket> => {
  if (!packet || !packet.body) {
    return false;
  }
  return true;
};
