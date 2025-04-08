import { Fragment, type FC, type PropsWithChildren } from "react";
import { Overlay as O, Paper, Text } from "@mantine/core";
import { AxiosError, isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";

import { useUser } from "@/hooks/useUser";

import { Warning } from "../Alerts";
import { DisplayErrorText } from "../Error";

const Overlay = motion.create(O as any);

const LoginError: FC = () => (
  <Overlay fixed center color="var(--mantine-color-body)">
    <Paper shadow="sm" p={0} radius="md" withBorder>
      <Warning title="Error">
        <Text size="sm">An error occurred while logging you in.</Text>
        <Text size="sm">
          {"You may try to "}
          <a href={`/relogin`}>re-login</a>
        </Text>
      </Warning>
    </Paper>
  </Overlay>
);

const ServerError: FC<{ e: AxiosError }> = ({ e }) => (
  <Overlay fixed center color="var(--mantine-color-body)">
    <Paper shadow="xs" p={0} radius="md" withBorder>
      <Warning title="Error">
        <DisplayErrorText error={e} />
      </Warning>
    </Paper>
  </Overlay>
);

const isLoginErrorStatus = (status: number | undefined): boolean =>
  status === 403 || status === 401;

const isServerErrorStatus = (status: number | undefined): boolean =>
  typeof status !== "undefined" && status >= 500;

const AuthHOC: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { error, status } = useUser();

  if (
    status === "error" &&
    isAxiosError(error) &&
    (isLoginErrorStatus(error.response?.status) ||
      isServerErrorStatus(error.response?.status))
  ) {
    return (
      <AnimatePresence
        key={
          isLoginErrorStatus(error.response?.status)
            ? "login-error"
            : "server-error"
        }
      >
        {isLoginErrorStatus(error.response?.status) ? (
          <LoginError />
        ) : (
          <ServerError e={error} />
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence initial={false}>
      <Fragment key="content">{children}</Fragment>
    </AnimatePresence>
  );
};

export default AuthHOC;
