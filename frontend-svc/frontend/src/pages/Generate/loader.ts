import type { DefaultError } from "@tanstack/react-query";
import type { LoaderFunction } from "react-router-dom";

import type { ProtoDefinition } from "@/hooks/generate/schemas";
import { getProtoDefaultsKeyAndEnsureDefaults } from "@/hooks/generate/useProtoDefaults";
import { getProtoSpecificParametersKeyAndEnsureDefaults } from "@/hooks/generate/useProtoSpecificParams";
import { queryClient } from "@/hooks/queryClient";

export type LoaderData = {
  proto: Promise<ProtoDefinition | null>;
  defaults: Promise<any | null>;
};

export const generateLoader: LoaderFunction = async ({ request, params }) => {
  const user = new URL(request.url).searchParams.get("user");
  if (params?.proto) {
    const queryKey = getProtoSpecificParametersKeyAndEnsureDefaults(
      params.proto,
      user,
    );
    const defaultsQueryKey = getProtoDefaultsKeyAndEnsureDefaults(
      params.proto,
      user,
    );

    return {
      proto: queryClient.ensureQueryData<
        unknown,
        DefaultError,
        ProtoDefinition
      >({
        queryKey,
      }),
      defaults: queryClient.ensureQueryData<unknown, DefaultError, any | null>({
        queryKey: defaultsQueryKey,
      }),
    };
  }

  return {
    proto: null,
    defaults: null,
  };
};
