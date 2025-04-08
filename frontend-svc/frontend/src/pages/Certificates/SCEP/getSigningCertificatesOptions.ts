import type { ComboboxData } from "@mantine/core";

import type { Certificate } from "@/hooks/certificates";

export const getSigningCertificatesOptions = (
  certificates: Certificate[] | undefined,
): ComboboxData =>
  certificates?.map((cert) => ({
    value: cert.id!,
    label: cert.friendly_name ?? cert.subject!,
  })) ?? [];
