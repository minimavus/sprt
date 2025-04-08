import { FC } from "react";
import { Alert, AlertProps } from "@mantine/core";
import { IconAlertSquareRounded, IconInfoCircle } from "@tabler/icons-react";

export const Warning: FC<AlertProps> = ({ children, ...props }) => {
  return (
    <Alert
      color="orange"
      variant="outline"
      icon={<IconAlertSquareRounded />}
      radius="md"
      {...props}
    >
      {children}
    </Alert>
  );
};

export const Info: FC<AlertProps> = ({ children, ...props }) => {
  return (
    <Alert
      color="blue"
      variant="outline"
      icon={<IconInfoCircle />}
      radius="md"
      {...props}
    >
      {children}
    </Alert>
  );
};
