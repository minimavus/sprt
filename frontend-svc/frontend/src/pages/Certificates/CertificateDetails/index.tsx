import {
  Anchor,
  Box,
  Button,
  Group,
  getThemeColor,
  List,
  Modal,
  rem,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconAlertTriangle, IconCornerDownRight } from "@tabler/icons-react";
import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import { DisplayError } from "@/components/Error";
import { DefaultLoaderFallback } from "@/components/Loader";
import {
  type Certificate,
  type CertType,
  useCertificate,
} from "@/hooks/certificates";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";

import { CertData } from "./CertData";

type ChainElementType = {
  id: string;
  subj: string;
  self_signed: boolean;
  cert: Certificate | null;
};

const NO_ROOT_ID = "no-root";

const Chain: FC<{
  chain: ChainElementType[];
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  sub?: boolean;
}> = ({ chain, selected, setSelected, sub }) => {
  const theme = useMantineTheme();
  if (chain.length === 0) {
    return null;
  }

  const noRoot = chain[0].id === NO_ROOT_ID;
  const color = getThemeColor("orange", theme);

  return (
    <List listStyleType="none" withPadding={sub}>
      <List.Item>
        <span
          style={{
            alignItems: noRoot ? "center" : undefined,
            position: "relative",
          }}
        >
          {noRoot ? (
            <Group gap={0}>
              <Box component="span" mr={rem(4)}>
                <IconAlertTriangle color={color} size={14} />
              </Box>
              <Text span>{chain[0].subj}</Text>
            </Group>
          ) : (
            <>
              {sub ? (
                <Box
                  component="span"
                  style={{ position: "absolute", left: "-16px" }}
                >
                  <IconCornerDownRight size={14} stroke={1.5} />
                </Box>
              ) : null}
              <Anchor
                onClick={() => setSelected(chain[0].id)}
                underline={selected === chain[0].id ? "never" : undefined}
                c={selected === chain[0].id ? "gray" : undefined}
                fw={selected === chain[0].id ? 700 : undefined}
                className={selected === chain[0].id ? "disabled" : ""}
              >
                {chain[0].subj}
              </Anchor>
            </>
          )}
        </span>
        <Chain
          selected={selected}
          setSelected={setSelected}
          chain={chain.slice(1)}
          sub
        />
      </List.Item>
    </List>
  );
};

const CertificateTree: FC<{ cert: Certificate }> = ({ cert }) => {
  const chain = useMemo(() => {
    const c: ChainElementType[] = [];

    let cursor: Certificate | undefined = cert;
    while (cursor) {
      c.unshift({
        id: cursor.id,
        subj: cursor.subject || "no subject",
        self_signed: cursor.self_signed || false,
        cert: cursor,
      });
      cursor = cursor.chain;
    }

    if (!c[0].self_signed) {
      c.unshift({
        id: NO_ROOT_ID,
        subj: "Root certificate not found",
        self_signed: false,
        cert: null,
      });
    }

    return c;
  }, [cert]);

  const [selected, setSelected] = useState(cert.id);
  const selectedCert = chain.find((c) => c.id === selected);

  return (
    <>
      <Group>
        <Chain chain={chain} selected={selected} setSelected={setSelected} />
      </Group>
      {selectedCert?.cert ? (
        selectedCert.cert.decode_error ? (
          <div style={{ marginTop: "16px" }}>
            <DisplayError error={selectedCert.cert.decode_error} />
          </div>
        ) : (
          <CertData cert={selectedCert.cert} />
        )
      ) : (
        <DisplayError error="Unknown certificate data" />
      )}
    </>
  );
};

const CertificateDetails: FC<{ type: CertType }> = ({ type }) => {
  const m = useParams<{ id: string }>();
  const [user] = useQueryUser();

  const { data, status, error, refetch } = useCertificate({
    id: m.id!,
    user,
    include_chain: true,
    type,
  });

  if (status === "pending") {
    return <DefaultLoaderFallback />;
  }

  if (status === "error") {
    return <DisplayError error={error} onReset={refetch} />;
  }

  return (
    <Stack>
      <CertificateTree cert={data} />
    </Stack>
  );
};

const CertificateDetailsModal: FC<{ type: CertType; levelsUp?: number }> = ({
  type,
  levelsUp = 1,
}) => {
  const { isOpen, onClose } = useDelayedModalState({ levelsUp });

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title="Certificate details"
    >
      <Stack gap="sm">
        <CertificateDetails type={type} />
        <Group justify="flex-end" gap="xs">
          <Button onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export { CertificateDetailsModal as CertificateDetails };
