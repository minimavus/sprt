import ip from "ipaddr.js";
import { path } from "rambda";
import type { FieldValues } from "react-hook-form";
import { z } from "zod/v4";

import type { Family } from "@/hooks/generate/schemas";

import { radiusParamsStore$ } from "./store";

const isIPv4 = (ip: ip.IPv4 | ip.IPv6): ip is ip.IPv4 => ip.kind() === "ipv4";

const compareParts = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      return -1;
    }
    if (a[i] > b[i]) {
      return 1;
    }
  }
  return 0;
};

const macAddressForm = z.discriminatedUnion("how", [
  z.object({
    how: z.literal("random"),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("pattern"),
    pattern: z.string().nonempty("Pattern cannot be empty"),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("list"),
    list: z.string().nonempty("List cannot be empty"),
    select: z.enum(["random", "sequential"]).default("sequential"),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("range"),
    start: z.string().nonempty("Start of range is required"),
    end: z.string().nonempty("End of range is required"),
    random: z.boolean(),
    step: z.number().min(1),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("dictionary"),
    dictionaries: z
      .set(z.string())
      .or(z.array(z.string()))
      .transform((v) => (Array.isArray(v) ? v : Array.from(v))),
    select: z.enum(["random", "sequential"]).default("sequential"),
    allowRepeats: z.boolean(),
  }),
]);

const ipAddressesForm = z.discriminatedUnion("how", [
  z.object({
    how: z.literal("random"),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("list"),
    list: z.string().nonempty("List cannot be empty"),
    select: z.enum(["random", "sequential"]).default("sequential"),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("range"),
    range: z
      .string()
      .nonempty("Range cannot be empty")
      .check((ctx) => {
        if (!ctx.value) {
          ctx.issues.push({
            code: "custom",
            message: "Range cannot be empty",
            input: ctx.value,
          });
          return z.NEVER;
        }
        if (ctx.value.includes("-")) {
          const [start, end] = ctx.value.split(/\s*-\s*/);
          try {
            const parsedStart = ip.parse(start);
            const parsedEnd = ip.parse(end);
            if (isIPv4(parsedStart) !== isIPv4(parsedEnd)) {
              ctx.issues.push({
                code: "custom",
                message: "Addresses in range must be of the same version",
                input: ctx.value,
              });
              return z.NEVER;
            }
            if (
              compareParts(
                isIPv4(parsedStart) ? parsedStart.octets : parsedStart.parts,
                isIPv4(parsedEnd) ? parsedEnd.octets : parsedEnd.parts,
              ) >= 0
            ) {
              ctx.issues.push({
                code: "custom",
                message: "Start of range must be less than end of range",
                input: ctx.value,
              });
              return z.NEVER;
            }
          } catch (e) {
            console.warn(e);
            ctx.issues.push({
              code: "custom",
              message: "Invalid IP range",
              input: ctx.value,
            });
            return z.NEVER;
          }
          return;
        } else {
          if (!ip.isValidCIDR(ctx.value)) {
            ctx.issues.push({
              code: "custom",
              message: "Invalid CIDR notation",
              input: ctx.value,
            });
            return z.NEVER;
          }
        }
      }),
    random: z.boolean(),
    step: z.number().min(1).optional(),
    allowRepeats: z.boolean(),
  }),
  z.object({
    how: z.literal("dictionary"),
    dictionaries: z
      .set(z.string())
      .or(z.array(z.string()))
      .transform((v) => (Array.isArray(v) ? v : Array.from(v))),
    select: z.enum(["random", "sequential"]).default("sequential"),
    allowRepeats: z.boolean(),
  }),
]);

const basicRadiusAttributeForm = z.object({
  dictionary: z.string().nullish(),
  name: z.string(),
  value: z.string(),
  vendor: z.string().nullish(),
  custom: z.boolean().optional(),
  base64: z.boolean().optional(),
});

export type BasicRadiusAttributeForm = z.infer<typeof basicRadiusAttributeForm>;

const vendorSpecificRadiusAttributeForm = z.object({
  name: z.literal("Vendor-Specific"),
  value: z.array(basicRadiusAttributeForm),
  vendor: z.string(),
  custom: z.boolean().optional(),
});

export type VendorSpecificRadiusAttributeForm = z.infer<
  typeof vendorSpecificRadiusAttributeForm
>;

const radiusAttributeForm = z.union([
  basicRadiusAttributeForm,
  vendorSpecificRadiusAttributeForm,
]);

const radiusAttributesForm = z.object({
  dictionaries: z
    .set(z.string())
    .or(z.array(z.string()))
    .transform((v) => (Array.isArray(v) ? v : Array.from(v))),
  attributes: z.object({
    accessRequest: z.array(radiusAttributeForm),
    accountingStart: z.array(radiusAttributeForm),
  }),
});

const schedulerForm = z.discriminatedUnion("what", [
  z.object({
    what: z.literal("nothing"),
  }),
  z.object({
    what: z.literal("job"),
    params: z.discriminatedUnion("how", [
      z.object({
        how: z.literal("when-finished"),
        times: z.number().min(-1).int(),
        latency: z.number().min(0),
        latencyUnit: z
          .enum(["seconds", "minutes", "hours", "days"])
          .default("minutes"),
      }),
      z.object({
        how: z.literal("schedule"),
        cron: z.string().nonempty(),
      }),
    ]),
  }),
  z.object({
    what: z.literal("interim-updates"),
    cron: z.string().nonempty(),
    attributes: z.object({
      acctSessionTime: z.enum(["since-start", "since-last"]),
      acctInputOctets: z.number().min(0),
      acctOutputOctets: z.number().min(0),
      acctInputPackets: z.number().min(0),
      acctOutputPackets: z.number().min(0),
      additional: z.array(z.any()).or(z.string()),
    }),
  }),
]);

const latencyRangeRegex = /^\d+\.\.\d+$/;

export const radiusForm = z.object({
  general: z.object({
    nas: z.object({
      nasIp: z.string().nonempty(),
      connectionType: z.string().nonempty(),
      mtu: z.coerce.number().min(1),
      sessionIdTemplate: z.string().nonempty(),
      timeout: z.number().min(0),
      retransmits: z.number().min(0),
    }),
    server: z.object({
      address: z.string().nonempty(),
      authPort: z.number().positive().max(65535),
      acctPort: z.number().positive().max(65535),
      secret: z.string(),
      save: z.boolean(),
      loadedId: z.string().optional(),
    }),
    job: z.object({
      name: z.string(),
      sessionsAmount: z.number().min(1),
      latency: z.union([
        z.coerce.number().min(0),
        z.string().nonempty().regex(latencyRangeRegex),
      ]),
      multiThread: z.boolean(),
      saveSessions: z.boolean(),
      bulkName: z.string(),
      withAcctStart: z.boolean(),
      latencyAcctStart: z.union([
        z.coerce.number().min(0),
        z.string().nonempty().regex(latencyRangeRegex),
      ]),
      withDACL: z.boolean(),
    }),
  }),
  macAddresses: macAddressForm,
  ipAddresses: ipAddressesForm,
  radius: radiusAttributesForm,
  scheduler: schedulerForm,
});

export type RadiusForm = z.infer<typeof radiusForm>;

export type RadiusAttributeLocation = keyof RadiusForm["radius"]["attributes"];

export const getDefaultValue = () =>
  ({
    general: {
      nas: {
        nasIp: "",
        connectionType: "Wireless-802.11",
        mtu: 1300,
        sessionIdTemplate:
          "uc(hex(rand(4096..65535)))/uc($MAC$)/uc(hex(rand(4096..65535)))",
        timeout: 5,
        retransmits: 0,
      },
      server: {
        address: "",
        authPort: 1812,
        acctPort: 1813,
        secret: "",
        save: true,
      },
      job: {
        name: "",
        sessionsAmount: 0,
        latency: 0,
        multiThread: true,
        saveSessions: true,
        bulkName: "",
        withAcctStart: true,
        latencyAcctStart: 0,
        withDACL: true,
      },
    },
    macAddresses: {
      how: "random",
      allowRepeats: true,
    },
    ipAddresses: {
      how: "random",
      allowRepeats: true,
    },
    radius: {
      dictionaries: [],
      attributes: {
        accessRequest: [],
        accountingStart: [],
      },
    },
    scheduler: {
      what: "nothing",
    },
  }) as RadiusForm;

export type FieldWithId<T> = T & { id: string };

export function cleanupRadiusAttributes<D extends FieldValues>(
  data: D,
  nadFamily: Family,
): D {
  const accReq = path("radius.attributes.accessRequest", data);
  const accStart = path("radius.attributes.accountingStart", data);

  if (!Array.isArray(accReq) && !Array.isArray(accStart)) {
    return data;
  }

  const cleanedData = { ...data };

  if (Array.isArray(accReq)) {
    const cleanedAccReq = accReq.filter((attr: BasicRadiusAttributeForm) => {
      const s =
        radiusParamsStore$.radius.protoSpecific["accessRequest"].byName[
          attr.name
        ].get();
      if (s?.family_specific && s.family_specific !== nadFamily) {
        return false;
      }
      return true;
    });
    cleanedData.radius.attributes.accessRequest = cleanedAccReq;
  }

  if (Array.isArray(accStart)) {
    const cleanedAccStart = accStart.filter(
      (attr: BasicRadiusAttributeForm) => {
        const s =
          radiusParamsStore$.radius.protoSpecific["accountingStart"].byName[
            attr.name
          ].get();
        if (s?.family_specific && s.family_specific !== nadFamily) {
          return false;
        }
        return true;
      },
    );
    cleanedData.radius.attributes.accountingStart = cleanedAccStart;
  }

  return cleanedData;
}
