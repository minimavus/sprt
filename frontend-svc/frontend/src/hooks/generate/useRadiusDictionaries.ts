import {
  type DefaultError,
  type QueryKey,
  type UndefinedInitialDataOptions,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { symmetricDifference } from "rambda";
import { useRef } from "react";
import { z } from "zod";

import { queryClient } from "@/hooks/queryClient";
import { queryGetFn } from "@/hooks/useGetQuery";
import type { QueryUser } from "@/hooks/useQueryUser";
import { api } from "@/utils/apiCompose";
import failOrRetry from "@/utils/failOrRetry";
import { orMe } from "@/utils/orMe";

const getRadiusDictionariesQueryKey = (user: string): QueryKey => [
  "generate",
  "radius",
  "dictionaries",
  { user },
];

export const RadiusDictionarySchema = z.object({
  file: z.string(),
  name: z.string(),
  vendors: z.array(z.string()),
});

export type RadiusDictionary = z.infer<typeof RadiusDictionarySchema>;

const RadiusDictionariesResponseSchema = z.array(RadiusDictionarySchema);

export type RadiusDictionariesResponse = z.infer<
  typeof RadiusDictionariesResponseSchema
>;

const mapRadiusDictionariesByLetter = (
  dictionaries: RadiusDictionariesResponse,
) => {
  const sortedResult: [letter: string, dictionaries: RadiusDictionary[]][] = [];
  const mapByFile = new Map<string, RadiusDictionary>();

  for (const dictionary of dictionaries) {
    const letter = dictionary.name[0].toUpperCase();
    const found = sortedResult.find((x) => x[0] === letter);
    if (found) {
      found[1].push(dictionary);
    } else {
      sortedResult.push([letter, [dictionary]]);
    }

    mapByFile.set(dictionary.file, dictionary);
  }

  sortedResult.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, dictionaries] of sortedResult) {
    dictionaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  return { sorted: sortedResult, byFile: mapByFile };
};

export const getRadiusDictionariesQueryKeyAndEnsureDefaults = (
  user: QueryUser,
) => {
  const queryKey = getRadiusDictionariesQueryKey(orMe(user));

  const def = queryClient.getQueryDefaults(queryKey);
  if (!def || !def.queryFn) {
    queryClient.setQueryDefaults(queryKey, {
      queryFn: queryGetFn({
        url: api.v2`/generate/radius/dictionaries`,
        params: { user },
        schema: RadiusDictionariesResponseSchema,
        withSignal: true,
        allowEmpty: true,
      }),
      retry: failOrRetry(),
      select: mapRadiusDictionariesByLetter,
    });
  }

  return queryKey;
};

export function useRadiusDictionaries(user: QueryUser) {
  return useQuery<
    unknown,
    DefaultError,
    ReturnType<typeof mapRadiusDictionariesByLetter> | null
  >({
    queryKey: getRadiusDictionariesQueryKeyAndEnsureDefaults(user),
    refetchInterval: Infinity,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

const IntFlagSchema = z.object({
  Int: z.number(),
  Valid: z.boolean(),
});

const BoolFlagSchema = z.object({
  Bool: z.boolean(),
  Valid: z.boolean(),
});

export enum RadiusDictionaryAttributeType {
  AttributeString = 1,
  AttributeOctets = 2,
  AttributeIPAddr = 3,
  AttributeDate = 4,
  AttributeInteger = 5,
  AttributeIPv6Addr = 6,
  AttributeIPv6Prefix = 7,
  AttributeIFID = 8,
  AttributeInteger64 = 9,
  AttributeVSA = 10,
  AttributeEther = 11,
  AttributeABinary = 12,
  AttributeByte = 13,
  AttributeShort = 14,
  AttributeSigned = 15,
  AttributeTLV = 16,
  AttributeIPv4Prefix = 17,
}

const RadiusDictionaryAttributeSchema = z.object({
  Name: z.string(),
  OID: z.array(z.number()).nullable(),
  Type: z.enum(RadiusDictionaryAttributeType),
  Size: IntFlagSchema,
  FlagEncrypt: IntFlagSchema,
  FlagHasTag: BoolFlagSchema,
  FlagConcat: BoolFlagSchema,
});

export type RadiusDictionaryAttribute = z.infer<
  typeof RadiusDictionaryAttributeSchema
>;

const RadiusDictionaryValueSchema = z.object({
  Attribute: z.string(),
  Name: z.string(),
  Number: z.number(),
});

export type RadiusDictionaryValue = z.infer<typeof RadiusDictionaryValueSchema>;

const RadiusDictionaryVendorSchema = z.object({
  Name: z.string(),
  Number: z.number(),
  TypeOctets: z.number().nullable(),
  LengthOctets: z.number().nullable(),
  Attributes: z.array(RadiusDictionaryAttributeSchema.nullable()).nullable(),
  Values: z.array(RadiusDictionaryValueSchema.nullable()).nullable(),
});

export type RadiusDictionaryVendor = z.infer<
  typeof RadiusDictionaryVendorSchema
>;

const RadiusDictionaryBodySchema = z.object({
  Attributes: z.array(RadiusDictionaryAttributeSchema).nullable(),
  Vendors: z.array(RadiusDictionaryVendorSchema).nullable(),
  Values: z.array(RadiusDictionaryValueSchema).nullable(),
});

export type RadiusDictionaryBody = z.infer<typeof RadiusDictionaryBodySchema>;

const FullRadiusDictionarySchema = z.object({
  name: z.string(),
  friendly_name: z.string().optional(),
  data: RadiusDictionaryBodySchema,
});

export type FullRadiusDictionary = z.infer<typeof FullRadiusDictionarySchema>;

const getRadiusDictionaryQueryKey = (
  dictionary: string,
  user: string,
): QueryKey => ["generate", "radius", "dictionary", dictionary, { user }];

const getQueryParamsForRadiusDictionary = (
  dictionary: string,
  user: QueryUser,
): UndefinedInitialDataOptions<
  unknown,
  DefaultError,
  FullRadiusDictionary,
  QueryKey
> => ({
  queryKey: getRadiusDictionaryQueryKey(dictionary, orMe(user)),
  queryFn: queryGetFn({
    url: api.v2`/generate/radius/dictionaries/${dictionary}`,
    schema: FullRadiusDictionarySchema,
    params: { user },
    withSignal: true,
    allowEmpty: true,
  }),
  retry: failOrRetry(),
  refetchInterval: Infinity,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  staleTime: Infinity,
});

export function useRadiusDictionary(dictionary: string, user: QueryUser) {
  return useQuery(getQueryParamsForRadiusDictionary(dictionary, user));
}

export type DictionariesMap = Map<
  string,
  FullRadiusDictionary["data"] & {
    friendly_name?: string;
  }
>;

export function useRadiusDictionaryBulk(
  dictionaries: Set<string> | string[],
  user: QueryUser,
) {
  const combinedCached = useRef<DictionariesMap>(new Map());
  const updatedAt = useRef(0);

  return useQueries({
    queries: Array.from(dictionaries, (dictionary) =>
      getQueryParamsForRadiusDictionary(dictionary, user),
    ),
    combine: (results) => {
      const combinedNew: DictionariesMap = new Map();
      let latestUpdate = updatedAt.current;
      for (const result of results.values()) {
        if (result.isLoading || !result.data) {
          continue;
        }
        combinedNew.set(result.data.name, {
          ...result.data.data,
          friendly_name: result.data.friendly_name,
        });

        if (result.dataUpdatedAt > latestUpdate) {
          latestUpdate = result.dataUpdatedAt;
        }
      }

      const hasNewData =
        symmetricDifference(
          Array.from(combinedCached.current.keys()),
          Array.from(combinedNew.keys()),
        ).length > 0 || latestUpdate > updatedAt.current;

      if (hasNewData) {
        combinedCached.current = combinedNew;
        updatedAt.current = latestUpdate;
      }

      return {
        data: combinedCached.current,
        pending: results.some((result) => result.isPending),
        errors: results
          .filter((result) => result.isError)
          .map((result) => result.error),
        isError: results.some((result) => result.isError),
      };
    },
  });
}
