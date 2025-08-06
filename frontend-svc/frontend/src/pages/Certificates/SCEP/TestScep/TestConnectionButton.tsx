import { Button } from "@mantine/core";
import { IconCircleNumber1 } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { FC } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  ScepCaCertificateSchema,
  type ScepServerWithParsedCerts,
} from "@/hooks/certificates/scep";
import { api } from "@/utils/apiCompose";
import { getErrorMessage } from "@/utils/errors";
import { toast } from "@/utils/toasts";

export const TestConnectionButton: FC<{ disabled: boolean }> = ({
  disabled,
}) => {
  const [scepUrl, name] = useWatch<ScepServerWithParsedCerts, ["url", "name"]>({
    name: ["url", "name"],
  });
  const { setValue } = useFormContext<ScepServerWithParsedCerts>();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      setValue("ca_certificates", null);

      const r = await axios.post(api.v2`/scep/test/connection`, {
        name,
        url,
      });

      return z
        .object({
          ca_certificates: z.array(ScepCaCertificateSchema).nullable(),
        })
        .parse(r.data);
    },
    onError(error) {
      toast.error({
        title: "Error",
        message: getErrorMessage(error),
      });
    },
    onSuccess(data) {
      toast.success({
        title: "Success",
        message: "Connection successful",
      });
      setValue("ca_certificates", data.ca_certificates);
    },
  });

  return (
    <Button
      onClick={() => {
        mutateAsync({ name, url: scepUrl });
      }}
      size="compact-sm"
      leftSection={<IconCircleNumber1 size={16} />}
      disabled={disabled}
      loading={isPending}
    >
      Test connection
    </Button>
  );
};
