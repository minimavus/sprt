import { FC } from "react";
import { Button, ButtonProps } from "@mantine/core";
import { IconBinoculars } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import { usePxGridConnectionServiceLookup } from "@/hooks/pxgrid/services";
import { useQueryUser } from "@/hooks/useQueryUser";

export const LookupButton: FC<{
  variant?: ButtonProps["variant"];
}> = ({ variant = "outline" }) => {
  const { id, service } = useParams<{ id: string; service: string }>();
  const [user] = useQueryUser();
  const { mutate: lookupService, isPending } = usePxGridConnectionServiceLookup(
    id!,
    user,
  );

  return (
    <Button
      variant={variant}
      onClick={() => lookupService({ service: service! })}
      leftSection={<IconBinoculars size={16} />}
      loading={isPending}
    >
      Lookup Service
    </Button>
  );
};
