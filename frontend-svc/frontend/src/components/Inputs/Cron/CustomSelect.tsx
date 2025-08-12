import {
  CloseButton,
  Combobox,
  InputBase,
  SimpleGrid,
  useCombobox,
} from "@mantine/core";
import { type FC, useCallback, useMemo, useRef } from "react";
import {
  type Clicks,
  type CustomSelectProps,
  converter,
} from "react-cron-headless";

import styles from "./Cron.module.scss";

export const CustomSelect: FC<CustomSelectProps> = ({
  allowClear,
  grid,
  setValue,
  optionsList,
  locale,
  value,
  humanizeLabels,
  disabled,
  readOnly,
  leadingZero,
  clockFormat,
  period,
  unit,
  periodicityOnDoubleClick,
  mode,
  filterOption = () => true,
  placeholder,
  ...props
}) => {
  const combobox = useCombobox({});

  const options = useMemo(() => {
    if (optionsList) {
      return optionsList
        .map((option, index) => {
          const number = unit.min === 0 ? index : index + 1;

          return {
            value: number.toString(),
            label: option,
          };
        })
        .filter(filterOption);
    }

    return [...Array(unit.total)]
      .map((_, index) => {
        const number = unit.min === 0 ? index : index + 1;

        return {
          value: number.toString(),
          label: converter.formatValue(
            number,
            unit,
            humanizeLabels,
            leadingZero,
            clockFormat,
          ),
        };
      })
      .filter(filterOption);
  }, [optionsList, leadingZero, humanizeLabels, clockFormat]);

  const simpleClick = useCallback(
    (newValueOption: number | number[]) => {
      const newValueOptions = Array.isArray(newValueOption)
        ? newValueOption.toSorted((a, b) => a - b)
        : [newValueOption];
      let newValue: number[] = newValueOptions;

      if (value) {
        newValue = mode === "single" ? [] : [...value];

        newValueOptions.forEach((o) => {
          const newValueOptionNumber = Number(o);

          if (value.some((v) => v === newValueOptionNumber)) {
            newValue = newValue.filter((v) => v !== newValueOptionNumber);
          } else {
            newValue = [...newValue, newValueOptionNumber].toSorted(
              (a, b) => a - b,
            );
          }
        });
      }

      if (newValue.length === unit.total) {
        setValue([]);
      } else {
        setValue(newValue);
      }
    },
    [setValue, value],
  );

  const doubleClick = useCallback(
    (newValueOption: number) => {
      if (newValueOption !== 0 && newValueOption !== 1) {
        const limit = unit.total + unit.min;
        const newValue: number[] = [];

        for (let i = unit.min; i < limit; i++) {
          if (i % newValueOption === 0) {
            newValue.push(i);
          }
        }
        const oldValueEqualNewValue =
          value &&
          newValue &&
          value.length === newValue.length &&
          value.every((v: number, i: number) => v === newValue[i]);
        const allValuesSelected = newValue.length === options.length;

        if (allValuesSelected) {
          setValue([]);
        } else if (oldValueEqualNewValue) {
          setValue([]);
        } else {
          setValue(newValue);
        }
      } else {
        setValue([]);
      }
    },
    [value, options, setValue],
  );

  const clicksRef = useRef<Clicks[]>([]);
  const onOptionClick = useCallback(
    (newValueOption: string) => {
      if (!readOnly) {
        const doubleClickTimeout = 300;
        const clicks = clicksRef.current;

        clicks.push({
          time: new Date().getTime(),
          value: Number(newValueOption),
        });

        const id = window.setTimeout(() => {
          if (
            periodicityOnDoubleClick &&
            clicks.length > 1 &&
            clicks[clicks.length - 1].time - clicks[clicks.length - 2].time <
              doubleClickTimeout
          ) {
            if (
              clicks[clicks.length - 1].value ===
              clicks[clicks.length - 2].value
            ) {
              doubleClick(Number(newValueOption));
            } else {
              simpleClick([
                clicks[clicks.length - 2].value,
                clicks[clicks.length - 1].value,
              ]);
            }
          } else {
            simpleClick(Number(newValueOption));
          }

          clicksRef.current = [];
        }, doubleClickTimeout);

        return () => {
          window.clearTimeout(id);
        };
      }
    },
    [clicksRef, simpleClick, doubleClick, readOnly, periodicityOnDoubleClick],
  );

  const optionsRender = useMemo(() => {
    return options.map((option) => (
      <Combobox.Option
        key={option.value}
        value={option.value}
        onClick={() => onOptionClick(option.value)}
        selected={value?.includes(Number.parseInt(option.value))}
        className={styles.combobox__option}
      >
        {option.label}
      </Combobox.Option>
    ));
  }, [options, setValue, value]);

  const stringValue = useMemo(() => {
    if (value && Array.isArray(value)) {
      return value.map((value: number) => value.toString());
    }
  }, [value]);

  const renderTag = useMemo(() => {
    if (!value || value[0] !== Number(stringValue?.[0])) {
      return null;
    }

    const parsedArray = converter.parsePartArray(value, unit);
    const cronValue = converter.partToString(
      parsedArray,
      unit,
      humanizeLabels,
      leadingZero,
      clockFormat,
    );
    const testEveryValue = cronValue.match(/^\*\/([0-9]+),?/) || [];

    return testEveryValue[1]
      ? `${locale.everyText} ${testEveryValue[1]}`
      : cronValue;
  }, [value, humanizeLabels, leadingZero, clockFormat, stringValue]);

  return (
    <Combobox store={combobox} withinPortal {...props}>
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={
            stringValue?.length ? (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setValue([])}
                aria-label="Clear value"
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents={value === null ? "none" : "all"}
        >
          {renderTag || placeholder}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className={styles.combobox__dropdown}>
        <Combobox.Options>
          <SimpleGrid cols={grid ? 6 : 1} spacing="xs">
            {optionsRender}
          </SimpleGrid>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
