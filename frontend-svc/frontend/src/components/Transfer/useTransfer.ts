import { useCallback, useState } from "react";

import type {
  TransferSide,
  TransferToBeTransferred,
  TransferTreeData,
  TransferTreeDatum,
} from "./types";

export interface UseTransferProps<TData extends TransferTreeDatum> {
  initSource: TransferTreeData<TData>;
  initTarget: TransferTreeData<TData>;
  onBeforeTransfer?: (
    transferFrom: TransferSide,
    toTransfer: TransferTreeData<TData>,
  ) => boolean;
  onAfterTransfer?: (
    transferFrom: TransferSide,
    final: TransferTreeData<TData>,
  ) => void;
}

const buildTransferData = <TData extends TransferTreeDatum>(
  source: TransferTreeData<TData>,
  target: TransferTreeData<TData>,
  toTransfer: TransferToBeTransferred,
) => {
  const sourceData = { ...source };
  const targetData = { ...target };
  const transfer: TransferTreeData<TData> = {};

  Object.entries(toTransfer).forEach(([categoryKey, keys]) => {
    const sourceCategory = sourceData[categoryKey];
    let targetCategory = targetData[categoryKey];

    if (!sourceCategory) {
      return;
    }

    if (!targetCategory) {
      targetData[categoryKey] = {
        ...sourceCategory,
        label: sourceCategory.label,
      };
      delete targetData[categoryKey].values;
      targetCategory = targetData[categoryKey];
    }

    if (!transfer[categoryKey]) {
      transfer[categoryKey] = {
        ...sourceCategory,
        label: sourceCategory.label,
      };
      delete transfer[categoryKey].values;
    }

    keys.forEach((key) => {
      if (!sourceCategory.values) {
        return;
      }

      const { [key]: item, ...rest } = sourceCategory.values;
      if (!item) {
        return;
      }

      sourceCategory.values = rest;

      if (!targetCategory.values) {
        targetCategory.values = {};
      }
      targetCategory.values[key] = item;

      if (!transfer[categoryKey].values) {
        transfer[categoryKey].values = {};
      }
      transfer[categoryKey].values[key] = { ...item };
    });

    if (Object.keys(sourceCategory.values ?? {}).length === 0) {
      delete sourceData[categoryKey];
    }
  });

  return { sourceData, targetData, transfer };
};

export const useTransfer = <TData extends TransferTreeDatum>({
  initSource,
  initTarget,
  onBeforeTransfer,
  onAfterTransfer,
}: UseTransferProps<TData>) => {
  const [sourceData, setSourceData] = useState(initSource);
  const [targetData, setTargetData] = useState(initTarget);

  const onTransfer = useCallback(
    (transferFrom: TransferSide, toTransfer: TransferToBeTransferred) => {
      const source = transferFrom === "source" ? sourceData : targetData;
      const target = transferFrom === "source" ? targetData : sourceData;
      const setSource =
        transferFrom === "source" ? setSourceData : setTargetData;
      const setTarget =
        transferFrom === "source" ? setTargetData : setSourceData;

      const builtData = buildTransferData<TData>(source, target, toTransfer);
      if (
        onBeforeTransfer &&
        !onBeforeTransfer(transferFrom, builtData.transfer)
      ) {
        return;
      }

      setSource(builtData.sourceData);
      setTarget(builtData.targetData);
      onAfterTransfer?.(transferFrom, builtData.targetData);
    },
    [sourceData, targetData, onBeforeTransfer, onAfterTransfer],
  );

  return {
    sourceData,
    targetData,
    onTransfer,
  };
};
