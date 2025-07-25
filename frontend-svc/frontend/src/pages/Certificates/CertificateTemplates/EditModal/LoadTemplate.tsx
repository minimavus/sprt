import { Button, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import type { FC } from "react";
import { useFormContext } from "react-hook-form";

import {
  type CertTemplate,
  getCertTemplateKeyAndEnsureDefaults,
  useCertTemplates,
} from "@/hooks/certificates/templates";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";
import { toast } from "@/utils/toasts";

import { prepDefaultValues } from "./formHelpers";
import type { FormValues } from "./types";

export const LoadTemplate: FC = () => {
  const [user] = useQueryUser();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useCertTemplates({ user });
  const { reset, getValues } = useFormContext<FormValues>();

  const onLoad = async (id: string) => {
    const toastId = toast.loading({
      title: "Loading Template",
      message: "Loading template data...",
      autoClose: false,
    });
    try {
      const tpl = await qc.ensureQueryData({
        queryKey: getCertTemplateKeyAndEnsureDefaults(user, id),
      });
      toast.success({
        id: toastId,
        title: "Template Loaded",
        message: "Template data loaded successfully",
      });
      const populated = await prepDefaultValues(tpl as CertTemplate)();
      reset(
        {
          ...getValues(),
          content: populated.content,
          withExtKeyUsage: populated.withExtKeyUsage,
          withKeyUsage: populated.withKeyUsage,
        },
        {
          keepDefaultValues: false,
          keepErrors: false,
          keepIsSubmitted: false,
          keepTouched: false,
          keepIsValid: false,
          keepDirty: false,
          keepDirtyValues: false,
          keepValues: false,
        },
      );
    } catch (e) {
      toast.error({
        id: toastId,
        title: "Error Loading Template",
        message: getErrorMessage(e),
      });
    }
  };

  const [isMenuOpen, { open, close }] = useDisclosure();

  return (
    <div>
      <Menu onOpen={() => open()} onClose={() => close()}>
        <Menu.Target>
          <Button
            variant="subtle"
            size="compact-xs"
            rightSection={
              <IconChevronDown
                size={14}
                style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
              />
            }
          >
            Load Saved Template
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {isLoading ? (
            <Menu.Item>Loading...</Menu.Item>
          ) : isError ? (
            <Menu.Item>Error loading templates</Menu.Item>
          ) : (
            data?.map((t) => (
              <Menu.Item key={t.id} onClick={() => onLoad(t.id)}>
                {t.friendly_name}
              </Menu.Item>
            )) || <Menu.Item>No templates found</Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};
