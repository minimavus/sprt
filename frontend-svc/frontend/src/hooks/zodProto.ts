import { z } from "zod";

export const zodProto = z.enum(["radius", "tacacs"]);

export type Protos = z.infer<typeof zodProto>;
