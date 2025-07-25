import { isEmpty } from "@legendapp/state";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconCirclePlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { type FC, type ReactNode, useCallback, useMemo, useState } from "react";
import { type UseFieldArrayAppend, useWatch } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { ModalFooter } from "@/components/Modals/Parts/ModalFooter";
import { TransferList } from "@/components/Transfer";
import type {
  TransferTreeBaseDatum,
  TransferTreeData,
  TransferTreeDatum,
  TransferTreeDatumCategoryValues,
} from "@/components/Transfer/types";
import { useTransfer } from "@/components/Transfer/useTransfer";
import {
  type DictionariesMap,
  useRadiusDictionaryBulk,
} from "@/hooks/generate/useRadiusDictionaries";
import { type QueryUser, useQueryUser } from "@/hooks/useQueryUser";
import { toast } from "@/utils/toasts";

import type { RadiusAttributeLocation, RadiusForm } from "../../form";

const dictsMapToTree = (
  dicts: DictionariesMap,
  vsa = false,
  vendorFromProps?: string,
): TransferTreeData<VendorisedDatum> => {
  const tree: TransferTreeData<VendorisedDatum> = {};
  for (const [dict, data] of dicts.entries()) {
    tree[dict] = {
      label: data.friendly_name ?? dict,
      values: {},
    };
    if (data.Attributes && !vsa) {
      tree[dict].values = data.Attributes.reduce(
        (acc, attr) => {
          acc[attr.Name] = { label: attr.Name };
          return acc;
        },
        (tree[dict]?.values || {}) as TransferTreeDatumCategoryValues,
      );
    }
    if (data.Vendors) {
      for (const vendor of data.Vendors) {
        if (vsa && vendorFromProps && vendor.Name !== vendorFromProps) {
          continue;
        }

        if (vendor.Attributes) {
          tree[dict].values = vendor.Attributes.reduce(
            (acc, attr) => {
              if (!attr) return acc;
              acc[attr.Name] = {
                label: attr.Name,
                vendor: vendor.Name,
              } as TransferTreeBaseDatum & { vendor: string };
              return acc;
            },
            (tree[dict]?.values || {}) as TransferTreeDatumCategoryValues,
          );
        }
      }
    }
    if (isEmpty(tree[dict].values!)) {
      delete tree[dict];
    }
  }
  return tree;
};

const AttributesTree: FC<{
  data: DictionariesMap;
  targetData: TransferTreeData;
  setTargetData: (data: TransferTreeData) => void;
  vsa?: boolean;
  vendor?: string;
}> = ({
  data,
  targetData: targetTreeInput,
  setTargetData: setTargetTreeInput,
  vsa = false,
  vendor,
}) => {
  const treeData = useMemo(
    () => dictsMapToTree(data, vsa, vendor),
    [data, vsa, vendor],
  );

  const { sourceData, targetData, onTransfer } = useTransfer({
    initSource: treeData,
    initTarget: targetTreeInput,
    onBeforeTransfer(_, v) {
      if (vsa) {
        let checkVendor = vendor;
        for (const [_, attrs] of Object.entries(v)) {
          if (!attrs.values) {
            continue;
          }
          for (const [_, d] of Object.entries(attrs.values)) {
            if (!checkVendor) {
              checkVendor = (d as VendorisedDatum).vendor;
              continue;
            }

            if ((d as VendorisedDatum).vendor !== checkVendor) {
              toast.error({
                title: "Error",
                message: "Attributes must be from the same vendor",
              });
              return false;
            }
          }
        }
      }
      return true;
    },
    onAfterTransfer(fromSide, transferred) {
      if (fromSide === "source") {
        setTargetTreeInput(transferred);
      }
    },
  });

  return (
    <TransferList
      source={sourceData}
      target={targetData}
      onTransfer={onTransfer}
      sortKeys
    />
  );
};

const AttributeSelectModal: FC<{
  onClose: () => void;
  onAdd: (selected: TransferTreeData) => void;
  dictionaries: string[];
  user: QueryUser;
  vsa?: boolean;
  vendor?: string;
}> = ({
  onClose,
  onAdd,
  dictionaries,
  user,
  vsa = false,
  vendor: vendorFromProps,
}) => {
  const { data, errors, isError, pending } = useRadiusDictionaryBulk(
    dictionaries,
    user,
  );

  const [targetData, setTargetData] = useState<TransferTreeData>({});

  const vendor = useMemo(() => {
    return (
      vendorFromProps ??
      (Object.values(targetData).at(0)?.values
        ? (Object.values(Object.values(targetData).at(0)!.values!).at(0) as any)
            ?.vendor
        : undefined)
    );
  }, [vendorFromProps, targetData]);

  return (
    <Stack flex={1} style={{ overflow: "hidden" }}>
      {isError ? (
        errors.map((error) => <DisplayError error={error} before={null} />)
      ) : pending ? (
        <Stack gap="xs" align="center">
          <Loader />
          <Text>Loading dictionaries</Text>
        </Stack>
      ) : (
        <AttributesTree
          data={data}
          targetData={targetData}
          setTargetData={setTargetData}
          vsa={vsa}
          vendor={vendor}
        />
      )}
      <ModalFooter>
        <Button onClick={onClose as any} variant="default">
          Cancel
        </Button>
        <Button
          disabled={isEmpty(targetData)}
          onClick={() => onAdd(targetData)}
        >
          Add
        </Button>
      </ModalFooter>
    </Stack>
  );
};

interface VendorisedDatum extends TransferTreeDatum {
  vendor?: string;
}

export const AddAttribute: FC<{
  append: UseFieldArrayAppend<
    RadiusForm,
    `radius.attributes.${RadiusAttributeLocation}`
  >;
  label?: ReactNode;
  vsa?: boolean;
  vendor?: string;
}> = ({ append, label = "Add Attribute", vsa = false, vendor }) => {
  const dictionaries = useWatch<RadiusForm, "radius.dictionaries">({
    name: "radius.dictionaries",
  });
  const [user] = useQueryUser();

  const addAttributes = useCallback(
    (selected: TransferTreeData) => {
      for (const [dict, attrs] of Object.entries(selected)) {
        if (!attrs.values) {
          continue;
        }
        for (const [attr, d] of Object.entries(attrs.values)) {
          append(
            {
              name: attr,
              value: "",
              dictionary: dict,
              vendor: (d as VendorisedDatum).vendor,
              custom: true,
            },
            { shouldFocus: true },
          );
        }
      }
    },
    [append],
  );

  const onAdd = useCallback(() => {
    const modalId = nanoid();
    modals.open({
      modalId,
      size: "xl",
      title: "Select attributes to add",
      children: (
        <AttributeSelectModal
          onClose={() => {
            modals.close(modalId);
          }}
          onAdd={(s) => {
            addAttributes(s);
            modals.close(modalId);
          }}
          dictionaries={dictionaries}
          user={user}
          vsa={vsa}
          vendor={vendor}
        />
      ),
      styles: {
        content: {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flex: 1,
        },
        body: {
          flex: 1,
          display: "flex",
          overflow: "hidden",
          flexDirection: "column",
        },
      },
    });
  }, [addAttributes, dictionaries, user, vsa, vendor]);

  return (
    <Group justify="center">
      <Button
        leftSection={<IconCirclePlus size={14} />}
        variant="subtle"
        onClick={onAdd}
      >
        {label}
      </Button>
    </Group>
  );
};
