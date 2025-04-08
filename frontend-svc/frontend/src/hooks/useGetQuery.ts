import {
  useQuery,
  type DefaultError,
  type QueryFunction,
  type QueryKey,
  type UndefinedInitialDataOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import axios from "axios";
import { isEmpty } from "rambda";
import { z } from "zod";

import failOrRetry, { RetryOptions } from "@/utils/failOrRetry";

export type QueryGetParams<
  Url extends string,
  K extends QueryKey,
  Response extends z.ZodSchema,
  Result = z.infer<Response>,
> = {
  url: Url;
  queryKey: K | undefined;
  schema: Response;
  mapper?: (value: z.infer<Response>) => Result;
  params?: any;
  withSignal?: boolean;
  placeholderData?: UndefinedInitialDataOptions<
    Response,
    Error,
    Result,
    K
  >["placeholderData"];
  retryOptions?: RetryOptions;
} & Pick<
  UseQueryOptions<Response, DefaultError, Result, K>,
  Extract<
    keyof UseQueryOptions<Response, DefaultError, Result, K>,
    `refetch${string}` | `stale${string}`
  >
>;

export const queryGetFn =
  <
    Url extends string,
    K extends QueryKey,
    Response extends z.ZodSchema,
    Result = z.infer<Response>,
  >({
    url,
    withSignal,
    params,
    schema,
    allowEmpty,
  }: Pick<
    QueryGetParams<Url, K, Response, Result>,
    "url" | "withSignal" | "params" | "schema"
  > & { allowEmpty?: boolean }): QueryFunction<Result, K> =>
  async ({ signal }) => {
    const r = await axios.get(url, {
      signal: withSignal ? signal : undefined,
      params,
    });

    if (allowEmpty && (r.data === "" || isEmpty(r.data))) {
      return null;
    }

    return schema.parse(r.data);
  };

export function useGetQuery<
  Url extends string,
  K extends QueryKey,
  Response extends z.ZodSchema,
  Result = z.infer<Response>,
>({
  url,
  queryKey,
  schema,
  mapper,
  params,
  withSignal = true,
  placeholderData,
  retryOptions,
  ...props
}: QueryGetParams<Url, K, Response, Result>): UseQueryResult<Result> {
  return useQuery<Response, DefaultError, Result, K>({
    retry: failOrRetry(retryOptions),
    queryKey: queryKey ?? (["-no-use-"] as unknown as K),
    enabled: Boolean(queryKey),
    queryFn: queryGetFn({ url, schema, params, withSignal }),
    select: mapper,
    placeholderData: placeholderData as any,
    ...props,
  });
}

// export function useSuspenseGetQuery<
//   Url extends string,
//   K extends QueryKey,
//   Response extends z.ZodSchema,
//   Result = z.infer<Response>,
// >({
//   url,
//   queryKey,
//   schema,
//   mapper,
//   params,
//   withSignal = true,
// }: QueryGetParams<Url, K, Response, Result>): UseSuspenseQueryResult<Result> {
//   return useSuspenseQuery<Result>({
//     refetchOnMount: true,
//     refetchOnWindowFocus: true,
//     retry: failOrRetry,
//     queryKey:queryKey ?? ["-no-use-"],
//     enabled:Boolean(queryKey),
//     staleTime: minutesToMilliseconds(5),
//     queryFn: queryGetFn({ url, schema, mapper, params, withSignal }),
//   });
// }
