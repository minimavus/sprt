import { type FC } from "react";

import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useVariableDef } from "@/hooks/generate/useVariableDefinition";
import { useQueryUser } from "@/hooks/useQueryUser";

import { useFormSchema } from "../formStateContext";
import { useAutoSchema } from "../hooks/useAutoSchema";
import { DynamicParametersBlock } from "./ParametersBlock";

export const GuestFlowParameters: FC = () => {
  const [user] = useQueryUser();
  const { data, status, error } = useVariableDef("guest", user);
  const schema$ = useFormSchema();

  useAutoSchema({ value: data, schema$ });

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error" || !data?.parameters?.length) {
    return (
      <DisplayError
        error={error ?? new Error("No data returned")}
        before="Error fetching definition for Guest Flow parameters:"
      />
    );
  }

  return <DynamicParametersBlock block={data.parameters[0]} />;
};
