import { Group } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { type FC, useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

import type { ScepServerWithParsedCerts } from "@/hooks/certificates/scep";

import { isValidUrl } from "../isValidUrl";
import { TestConnectionButton } from "./TestConnectionButton";
import { TestEnrollmentButton } from "./TestEnrollmentButton";
import { TestState } from "./types";

export const TestButtons: FC = () => {
  const [testState, setTestState] = useState<TestState>(TestState.NOT_POSSIBLE);
  const [scepUrl, caCertificates, signer] = useWatch<
    ScepServerWithParsedCerts,
    ["url", "ca_certificates", "signer"]
  >({
    name: ["url", "ca_certificates", "signer"],
  });

  useEffect(() => {
    const hasUrl = scepUrl && isValidUrl(scepUrl);
    if (hasUrl && caCertificates?.length && signer) {
      setTestState(TestState.CAN_TEST_ENROLLMENT);
    } else if (hasUrl) {
      setTestState(TestState.CAN_TEST_CONNECTION);
    } else {
      setTestState(TestState.NOT_POSSIBLE);
    }
  }, [scepUrl, caCertificates, signer]);

  return (
    <Group justify="center" gap="xs">
      <TestConnectionButton
        disabled={testState < TestState.CAN_TEST_CONNECTION}
      />
      <IconArrowRight size={16} />
      <TestEnrollmentButton
        disabled={testState < TestState.CAN_TEST_ENROLLMENT}
      />
    </Group>
  );
};
