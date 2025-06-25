import { createContext, FC, PropsWithChildren, use } from "react";
import { Observable } from "@legendapp/state";
import { use$, useObservable } from "@legendapp/state/react";
import { z } from "zod/v4";

type fieldState = "enabled" | "disabled" | "hidden";

type FormState = Record<string, fieldState>;

type ObservableFormState = Observable<FormState>;

type FormStateContextType = {
  state: ObservableFormState;
  schema: Observable<z.ZodObject<any>>;
};

const FormStateContext = createContext<FormStateContextType>(
  undefined as unknown as FormStateContextType,
);

type ProviderProps = PropsWithChildren<{
  schema: FormStateContextType["schema"];
}>;

export const FormStateProvider: FC<ProviderProps> = ({ children, schema }) => {
  const state$ = useObservable<FormState>({});

  return (
    <FormStateContext value={{ state: state$, schema }}>
      {children}
    </FormStateContext>
  );
};

export const useFormState = () => {
  const context = use(FormStateContext);
  if (!context) {
    throw new Error("useFormState must be used within a FormStateProvider");
  }
  return context.state;
};

export const useFormSchema = () => {
  const context = use(FormStateContext);
  if (!context) {
    throw new Error("useFormSchema must be used within a FormStateProvider");
  }
  return context.schema;
};

export function useFieldState(field: string): fieldState;
export function useFieldState(...fields: string[]): fieldState[];
export function useFieldState(...fields: string[]) {
  const state$ = useFormState();
  return use$(() => {
    if (fields.length === 1) {
      return state$[fields[0]].get() ?? "enabled";
    }
    return fields.map((field) => state$[field].get() ?? "enabled");
  });
}
