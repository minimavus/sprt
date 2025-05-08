import { useCallback, useMemo } from "react";
import { useWatch } from "react-hook-form";

import { Family } from "@/hooks/generate/schemas";
import { useNADSources } from "@/hooks/generate/useNADSources";
import { QueryUser } from "@/hooks/useQueryUser";

import { RadiusForm } from "../form";

export const useDetectNadFamily = (user: QueryUser) => {
  const { data: sources } = useNADSources(user);

  return useCallback(
    (value: string) =>
      sources?.find((s) => s.address === value)?.family ?? Family.IPv4,
    [sources],
  );
};

export const useNadFamily = (user: QueryUser) => {
  const source = useWatch<RadiusForm, "general.nas.nasIp">({
    name: "general.nas.nasIp",
  });

  const detect = useDetectNadFamily(user);

  return useMemo(() => detect(source), [detect, source]);
};
