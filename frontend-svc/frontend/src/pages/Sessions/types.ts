import { ServerWithSessions } from "@/hooks/sessions/schemas";

export type ResolvedServerData = ServerWithSessions | null;

export type ResolvedServersData = ServerWithSessions[] | null;

export type ResolvedData = ResolvedServerData | ResolvedServersData;

export type LoaderData = {
  server:
    | ResolvedServerData
    | Promise<ResolvedServerData>
    | ResolvedServersData
    | Promise<ResolvedServersData>;
};
