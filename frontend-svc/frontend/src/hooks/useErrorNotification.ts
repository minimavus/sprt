import { useEffect } from "react";

import { toast } from "@/utils/toasts";

type ErrorNotificationProps = {
  isError: boolean;
  title: string;
  description: string;
};

export function useErrorNotification({
  isError,
  title,
  description,
}: ErrorNotificationProps) {
  useEffect(() => {
    if (isError) {
      toast.error({ title, message: description });
    }
  }, [isError]);
}
