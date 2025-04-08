import { CertTemplate } from "@/hooks/certificates/templates";

export type LoaderData = {
  template: CertTemplate | Promise<CertTemplate>;
};

export type FormValues = CertTemplate & {
  withKeyUsage: boolean;
  withExtKeyUsage: boolean;
};
