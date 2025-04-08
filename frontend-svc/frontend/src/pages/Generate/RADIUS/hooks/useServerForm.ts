import { useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { Family } from "@/hooks/generate/schemas";
import { ServerSettings } from "@/hooks/settings/servers";

import { RadiusForm } from "../form";

export const useSetServerCb = () => {
  const lastLoaded = useRef<ServerSettings | null>(null);
  const { setValue, resetField } = useFormContext<RadiusForm>();

  const setNewServer = useCallback(
    (server: ServerSettings, family: Family) => {
      setValue(
        "general.server.address",
        (family === Family.IPv4
          ? server.address
          : server.attributes?.v6_address) ?? "",
        { shouldValidate: true, shouldDirty: true },
      );
      setValue("general.server.authPort", server.auth_port!, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("general.server.acctPort", server.acct_port!, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("general.server.secret", server.attributes?.shared ?? "", {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("general.server.loadedId", server.id);
      lastLoaded.current = server;
    },
    [setValue, lastLoaded],
  );

  const dropServer = useCallback(() => {
    setValue("general.server.address", "");
    resetField("general.server.authPort");
    resetField("general.server.acctPort");
    resetField("general.server.secret");
    setValue("general.server.loadedId", "");
    lastLoaded.current = null;
  }, [setValue, resetField]);

  const dropLoaded = useCallback(() => {
    setValue("general.server.loadedId", "");
    lastLoaded.current = null;
  }, [setValue]);

  return { setNewServer, dropServer, lastLoaded, dropLoaded };
};
