import { createContext, FC, ReactNode, use } from "react";
import { Center, Loader as L } from "@mantine/core";
import { FetchStatus, UseQueryResult } from "@tanstack/react-query";

import { DisplayError } from "@/components/Error";

type LoaderProps<Data> = UseQueryResult<Data> & {
  children:
    | ReactNode
    | ((data: NonNullable<Data>, fetchStatus: FetchStatus) => ReactNode);
  fallback?: ReactNode;
  errorComponent?: ReactNode | ((error: any) => ReactNode);
};

const ErrorContext = createContext<{ error: any }>(undefined!);

export const useLoaderError = () => use(ErrorContext).error;

const DataContext = createContext<{ data: any; fetchStatus: FetchStatus }>(
  undefined!,
);

export const useLoaderData = <Data = any,>() => use(DataContext).data as Data;

export const DefaultLoaderFallback: FC = () => (
  <Center flex={1} p="xl">
    <L size="xl" />
  </Center>
);

function Loader<Data>({
  data,
  children,
  error,
  status,
  fallback = <DefaultLoaderFallback />,
  fetchStatus,
  errorComponent = (error) => <DisplayError error={error} />,
}: LoaderProps<Data>): ReactNode {
  if (status === "pending") return fallback;
  if (status === "error")
    return typeof errorComponent === "function" ? (
      errorComponent(error)
    ) : (
      <ErrorContext value={{ error }}>{errorComponent}</ErrorContext>
    );

  return typeof children === "function" ? (
    children(data!, fetchStatus)
  ) : (
    <DataContext value={{ data, fetchStatus }}>{children}</DataContext>
  );
}

export { Loader };
