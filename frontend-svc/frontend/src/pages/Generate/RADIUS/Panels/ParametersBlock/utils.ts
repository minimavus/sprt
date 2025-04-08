import { Variant } from "@/hooks/generate/schemas";

export const withPrefix = (prefix: string, name: string) =>
  prefix ? `${prefix}.${name}` : name;

export const getVariantOptions = (variant: Variant[]) => {
  return variant.map((v) => ({
    label: v.short,
    value: v.name,
  }));
};

type RemoveLeadingDot<T extends string> = T extends `.${infer U}` ? U : T;

export const normalizeKeyPath = <T extends string>(
  str: T,
): RemoveLeadingDot<T> => {
  if (str.startsWith(".")) {
    return str.slice(1) as RemoveLeadingDot<T>;
  }
  return str as RemoveLeadingDot<T>;
};

export const normalizeLabel = (label: string) => {
  return label.replace(/(\w*[a-z0-9_]+\w*)/g, function (a) {
    return a.toLowerCase();
  });
};
