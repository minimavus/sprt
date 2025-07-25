import {
  Box,
  getThemeColor,
  rem,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { IconAlertTriangle, IconCircleFilled } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { FormatTime } from "@/components/Time";
import type { Certificate } from "@/hooks/certificates";

import styles from "./CertData.module.scss";

const DlLine: FC<{
  dt: string;
  dd: ReactNode;
  critical?: boolean;
  expired?: boolean;
}> = ({ dt, dd, critical, expired }) => {
  const theme = useMantineTheme();

  if (
    dd === null ||
    dd === undefined ||
    dd === "" ||
    (Array.isArray(dd) && dd.length === 0)
  ) {
    return null;
  }

  const color = getThemeColor("orange", theme);

  return (
    <>
      <dt className={styles.key}>
        <Text fw="bold">
          {critical ? (
            <Box component="span" mr={rem(4)}>
              <Tooltip label="Critical">
                <IconCircleFilled color={color} size={14} />
              </Tooltip>
            </Box>
          ) : null}
          {expired ? (
            <Box component="span" mr={rem(4)}>
              <Tooltip label="Expired">
                <IconAlertTriangle color={color} size={14} />
              </Tooltip>
            </Box>
          ) : null}
          {dt}
        </Text>
      </dt>
      <dd className={styles.value}>
        {Array.isArray(dd) ? (
          dd.map((v, i) => <Text key={i}>{v}</Text>)
        ) : (
          <Text>{dd}</Text>
        )}
      </dd>
    </>
  );
};

const BasicConstrainsDlLine: FC<{
  constrains: NonNullable<Certificate["decoded"]>["basicConstraints"];
}> = ({ constrains }) => {
  if (!constrains) {
    return null;
  }

  const ctrs = [];
  if (constrains.isCA) {
    ctrs.push("Subject Type = CA");
  }
  if (constrains.maxPathLen > 0 || constrains.maxPathLenZero) {
    ctrs.push(`Path Length Constraint = ${constrains.maxPathLen}`);
  }

  return (
    <DlLine dt="Basic constrains" dd={ctrs} critical={constrains.critical} />
  );
};

export const CertData: FC<{ cert: Certificate }> = ({ cert }) => {
  if (!cert.decoded) {
    return <Text>Certificate data is not available</Text>;
  }

  const decoded = cert.decoded;

  return (
    <>
      <Title order={3}>Basic Fields</Title>
      <dl className={styles.key_value_pairs}>
        <DlLine dt="Version" dd={decoded.version} />
        <DlLine dt="Serial number" dd={decoded.serial} />
        <DlLine dt="Signature algorithm" dd={decoded.signature} />
        <DlLine dt="Issuer" dd={decoded.issuer} />
        <DlLine
          dt="Valid from"
          dd={<FormatTime t={decoded.notBefore} showTZ />}
        />
        <DlLine
          dt="Valid till"
          dd={<FormatTime t={decoded.notAfter} showTZ />}
          expired={decoded.isExpired}
        />
        <DlLine dt="Subject" dd={decoded.subject} />
        <DlLine
          dt="Public key"
          dd={
            decoded.pubKey
              ? `${cert.decoded.pubKey.algo} (${cert.decoded.pubKey.size})`
              : null
          }
        />
      </dl>
      <Title order={3}>Extensions</Title>
      <dl className={styles.key_value_pairs}>
        <DlLine dt="Authority key identifier" dd={decoded.aki} />
        <DlLine dt="Subject key identifier" dd={decoded.ski} />
        <DlLine dt="Extended key usage" dd={decoded.extKeyUsage} />
        <DlLine
          dt="Key usage"
          dd={decoded.keyUsage.usage}
          critical={decoded.keyUsage.critical}
        />
        <BasicConstrainsDlLine constrains={decoded.basicConstraints} />
      </dl>
    </>
  );
};
