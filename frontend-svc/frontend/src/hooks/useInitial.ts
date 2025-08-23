import { useMemo } from "react";
import { z } from "zod";

import { usePreferredTheme } from "@/hooks/usePreferredTheme";
import { log } from "@/utils/log";

enum AccessLevel {
  Unknown = 0,
  Standard = 1,
  Customer = 2,
  Partner = 3,
  Cisco = 4,
}

export const UserSessionSchema = z
  .object({
    AccessLevel: z.enum(AccessLevel).nullish().default(AccessLevel.Unknown),
    Email: z.string().nullish().default(null),
    FirstName: z.string().nullish().default(null),
    LastName: z.string().nullish().default(null),
    Name: z.string().nullish().default(null),
    Roles: z.array(z.string()).nullish().default([]),
    UserID: z.string().nullish().default(null),
    UIDHashed: z.string().nullish().default(null),
  })
  .partial()
  .nullish()
  .default({});

export const UserAttributesSchema = (preferredTheme: "dark" | "light") =>
  z
    .looseObject({
      api: z.looseObject({}).nullish(),
      generate: z.looseObject({}).nullish(),
      sms: z.looseObject({}).nullish(),
      ui: z
        .looseObject({
          theme: z
            .enum(["light", "dark", "default"])
            .nullish()
            .default(preferredTheme),
          collapseMenu: z.boolean().nullish().default(false),
        })
        .nullish(),
      vars: z.looseObject({}).nullish(),
      versions: z.looseObject({}).nullish(),
    })
    .partial()
    .nullish()
    .prefault({
      ui: {
        theme: preferredTheme,
      },
    });

export type UserAttributes = z.infer<ReturnType<typeof UserAttributesSchema>>;

const GlobalSchema = (preferredTheme: "dark" | "light") =>
  z.object({
    Environment: z.enum(["dev", "production"]).nullish().default("production"),
    UserSession: UserSessionSchema,
    UserAttributes: UserAttributesSchema(preferredTheme),
    Flagsmith: z
      .object({
        enabled: z.boolean(),
        envID: z.string(),
      })
      .default({ enabled: false, envID: "" })
      .optional(),
    Theme: z.enum(["light", "dark"]).nullish(),
  });

export type InitialData = z.infer<ReturnType<typeof GlobalSchema>>;

const emptyData: InitialData = {
  Environment: "production",
  UserSession: {},
  UserAttributes: {},
};

const OurGlobals: Partial<Pick<InitialData, "Environment" | "Flagsmith">> = {};

export const getGlobalEnv = () => OurGlobals.Environment;
export const isInDev = () => getGlobalEnv() === "dev";

export function useInitial(): InitialData {
  const preferredTheme = usePreferredTheme();

  return useMemo(() => {
    if (!window) return emptyData;

    const parsed = GlobalSchema(preferredTheme).safeParse(window);

    if (parsed.success) {
      if (!Object.isFrozen(OurGlobals)) {
        Object.assign(OurGlobals, {
          Environment: parsed.data.Environment,
          Flagsmith: parsed.data.Flagsmith,
        });
        Object.freeze(OurGlobals);
      }

      return parsed.data;
    }

    log.error(parsed.error);
    return emptyData;
  }, [preferredTheme]);
}
