import { rem } from "@mantine/core";
import { NotificationData, notifications } from "@mantine/notifications";
import { IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";

const xIcon = <IconX style={{ width: rem(20), height: rem(20) }} />;
const checkIcon = <IconCheck style={{ width: rem(20), height: rem(20) }} />;
const infoIcon = <IconInfoCircle style={{ width: rem(20), height: rem(20) }} />;

const successToast = (data: NotificationData): string => {
  const compiledData: NotificationData = {
    ...data,
    icon: checkIcon,
    color: "teal",
    loading: false,
    autoClose: true,
  };

  if (data.id) {
    notifications.update(compiledData);
    return data.id;
  }

  return notifications.show(compiledData);
};

const errorToast = (data: NotificationData): string => {
  const compiledData: NotificationData = {
    ...data,
    icon: xIcon,
    color: "red",
    loading: false,
    autoClose: true,
  };

  if (data.id) {
    notifications.update(compiledData);
    return data.id;
  }

  return notifications.show(compiledData);
};

const loadingToast = (data: NotificationData): string => {
  return notifications.show({
    ...data,
    loading: true,
  });
};

const infoToast = (data: NotificationData): string => {
  const compiledData: NotificationData = {
    ...data,
    icon: infoIcon,
    loading: false,
    autoClose: true,
  };

  if (data.id) {
    notifications.update(compiledData);
    return data.id;
  }

  return notifications.show(compiledData);
};

export const toast = {
  success: successToast,
  error: errorToast,
  loading: loadingToast,
  info: infoToast,
};
