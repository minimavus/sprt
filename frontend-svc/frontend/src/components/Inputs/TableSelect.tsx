import { Button, Modal, type ModalProps, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { path } from "rambda";
import { type FC, type ReactNode, useEffect, useState } from "react";
import type { FieldError } from "react-hook-form";

import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { Table } from "@/components/Table";

import { SelectInput } from "./SelectInput";

type TableSelectOption = Record<string, any>;

type TableSelectProps = {
  page: TableSelectOption[];
  columns: TableSelectColumnDef[];
  onChange: (value: Array<string>) => void;
  onBlur?: () => void;
  value: Array<string>;
  label: ReactNode;
  inputLabel?: ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  singular?: string;
  plural?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: Error | FieldError;
  multiple?: boolean;
  idField?: string;
  nameField?: string;
} & PartialBy<ModalProps, "onClose" | "opened">;

type TableSelectColumnDef = {
  title: string;
  field: string;
};

const getColumnDefs = (
  columns: TableSelectColumnDef[],
): ColumnDef<TableSelectOption>[] => {
  return columns.map((column) => ({
    id: column.field,
    header: column.title,
    accessorKey: column.field,
  }));
};

export const TableSelect: FC<TableSelectProps> = ({
  page,
  columns,
  onChange: onChangeProp,
  value: initialValue,
  onBlur,
  onClose: onCloseProp,
  opened: openedProp,
  singular,
  plural,
  label = "Select",
  inputLabel,
  inputRef,
  error: errorProp,
  loading,
  disabled,
  multiple = true,
  idField = "id",
  nameField = "name",
  ...props
}) => {
  const [isOpen, { close: closeDrawer, open: openDrawer }] = useDisclosure(
    openedProp ?? false,
  );
  const [value, setValue] = useState<RowSelectionState>({});
  const [displayValue, setDisplayValue] = useState<string | undefined>();

  const close: typeof onCloseProp = () => {
    closeDrawer();
    onBlur?.();
    onCloseProp?.();
  };

  const onOk: typeof onCloseProp = () => {
    onChangeProp(Object.keys(value));
    if (!multiple) {
      if (Object.keys(value).length > 0) {
        const s = page.find((row) => row.id === Object.keys(value)[0]);
        const n = s ? path(nameField, s) : undefined;
        setDisplayValue(typeof n === "string" ? n : undefined);
      } else {
        setDisplayValue(undefined);
      }
    }
    close();
  };

  useEffect(() => {
    setValue(
      Array.from(initialValue).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as RowSelectionState),
    );
  }, [initialValue]);

  return (
    <>
      <SelectInput
        label={label}
        inputLabel={inputLabel}
        inputRef={inputRef}
        singular={singular}
        plural={plural}
        loading={loading}
        disabled={disabled}
        error={errorProp}
        selectedSize={initialValue?.length || 0}
        onSelect={openDrawer}
        displayValue={displayValue}
      />
      <Modal
        opened={isOpen}
        onClose={close}
        radius="md"
        title={`Select ${plural ?? "options"}`}
        {...props}
      >
        <Stack gap="sm">
          <Table
            data={page}
            columns={getColumnDefs(columns)}
            rowSelection={value}
            onRowSelectionChange={setValue}
            enableRowSelection
            pagination
            disableMoreRowSelection={
              multiple ? undefined : Object.keys(value).length > 0
            }
            highlightOnHover
            initialState={{
              pagination: {
                pageSize: 10,
              },
            }}
            paginationConfig={{
              getRowId: (row) => path(idField, row) as string,
              showPageSizeChanger: false,
            }}
          />
        </Stack>
        <ModalFooter stickyBottom>
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onOk}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
