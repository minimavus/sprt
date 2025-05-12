import type { FC, ReactNode } from "react";
import { Button, Stack, Table } from "@mantine/core";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import type { NADSource } from "@/hooks/generate/schemas";

export const SourcesModal: FC<{
  sources: NADSource[];
  close: () => void;
  preamble?: ReactNode;
}> = ({ sources, close, preamble = null }) => {
  return (
    <>
      <Stack gap="xs" mb="sm">
        {preamble}
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Address</Table.Th>
              <Table.Th>Interface</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sources.map((source) => (
              <Table.Tr key={source.address}>
                <Table.Td>{source.address}</Table.Td>
                <Table.Td>{source.interface}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
      <ModalFooter>
        <Button variant="subtle" size="sm" onClick={close}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
};
