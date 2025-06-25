import { z } from "zod/v4";

export const zodProto = z.enum(["radius", "tacacs"]);

export type Protos = z.infer<typeof zodProto>;
