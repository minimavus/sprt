import {
  type DefaultError,
  type QueryFunction,
  type QueryKey,
  type UndefinedInitialDataOptions,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { isEmpty } from "rambda";
import type { z } from "zod";

import failOrRetry, { type RetryOptions } from "@/utils/failOrRetry";

export type QueryGetParams<
  Url extends string,
  K extends QueryKey,
  Response extends z.ZodType,
  Result = z.infer<Response>,
> = {
  url: Url;
  queryKey: K | undefined;
  schema: Response;
  mapper?: (data: z.infer<Response> | null) => Result;
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
  UseQueryOptions<z.infer<Response> | null, DefaultError, Result, K>,
  Extract<
    keyof UseQueryOptions<z.infer<Response> | null, DefaultError, Result, K>,
    `refetch${string}` | `stale${string}`
  >
>;

export const queryGetFn =
  <Url extends string, K extends QueryKey, Response extends z.ZodType>({
    url,
    withSignal,
    params,
    schema,
    allowEmpty,
  }: Pick<
    QueryGetParams<Url, K, Response>,
    "url" | "withSignal" | "params" | "schema"
  > & { allowEmpty?: boolean }): QueryFunction<z.infer<Response> | null, K> =>
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
  Response extends z.ZodType,
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
  return useQuery<z.infer<Response> | null, DefaultError, Result, K>({
    retry: failOrRetry(retryOptions),
    queryKey: queryKey ?? (["-no-use-"] as unknown as K),
    enabled: Boolean(queryKey),
    queryFn: queryGetFn({ url, schema, params, withSignal }),
    select: mapper,
    placeholderData: placeholderData as any,
    ...props,
  });
}
