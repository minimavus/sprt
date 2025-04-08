import { useMemo } from "react";
import { useWatch } from "react-hook-form";

import { Family } from "@/hooks/generate/schemas";
import { useNADSources } from "@/hooks/generate/useNADSources";
import { QueryUser } from "@/hooks/useQueryUser";

import { RadiusForm } from "../form";

export const useNadFamily = (user: QueryUser) => {
  const { data: sources } = useNADSources(user);

  const source = useWatch<RadiusForm, "general.nas.nasIp">({
    name: "general.nas.nasIp",
  });

  return useMemo(
    () => sources?.find((s) => s.address === source)?.family ?? Family.IPv4,
    [sources, source],
  );
};
