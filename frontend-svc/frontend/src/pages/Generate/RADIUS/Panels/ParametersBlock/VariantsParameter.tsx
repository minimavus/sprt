import {
	Box,
	type BoxProps,
	Group,
	type PolymorphicComponentProps,
	Select,
	Stack,
} from "@mantine/core";
import cx from "classnames";
import { type FC, useCallback, useMemo, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import { DropdownSelect } from "@/components/Inputs/DropdownSelect";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";
import { log } from "@/utils/log";

import { useFieldState } from "../../formStateContext";
import type { ParameterComponent } from "./types";
import { useWatchActions } from "./useWatchActions";
import { getVariantOptions, withPrefix } from "./utils";
import styles from "./VariantsParameter.module.scss";

const Wrapper: FC<
	{ wrap?: boolean } & PolymorphicComponentProps<"div", BoxProps>
> = ({ wrap, children, ...props }) => {
	if (wrap) {
		return <Box {...props}>{children}</Box>;
	}
	return children;
};

export const VariantsParameter: ParameterComponent<"variants"> = ({
	p,
	prefix,
	ParamsMapped,
}) => {
	const name = withPrefix(prefix, p.name);
	const { control, clearErrors } = useFormContext();

	const {
		field: { value, onChange: fieldOnChange, ...field },
	} = useController({
		name: withPrefix(name, "variant"),
		defaultValue: p.value ?? p.variants[0]?.name,
	});

	const onChange = useCallback(
		(...event: unknown[]) => {
			const namesToClear = [];
			for (const n of control._names.mount) {
				if (n.startsWith(name)) {
					namesToClear.push(n);
				}
			}
			if (namesToClear.length) {
				clearErrors(namesToClear);
			}
			fieldOnChange(...event);
		},
		[name, fieldOnChange, control, clearErrors],
	);

	const allOptions = useMemo(() => getVariantOptions(p.variants), [p.variants]);
	const [options, setOptions] = useState(allOptions);

	useWatchActions({
		watch: p.watch,
		prefix,
		onHideValues: (_, actionParams, field, target) => {
			if (target !== name) {
				return;
			}
			if (!Array.isArray(actionParams)) {
				log.error(
					{ field, target },
					"onHideValues: actionParams is not an array",
				);
				return;
			}
			setOptions(allOptions.filter((v) => !actionParams.includes(v.value)));
		},
		onSetValue: (_, actionParams, _field, target) => {
			if (target !== name) {
				return;
			}
			onChange(actionParams);
		},
	});

	const state = useFieldState(name);

	if (state === "hidden") {
		return null;
	}

	return (
		<Wrapper wrap={p.inline} className={cx({ [styles.inline]: p.inline })}>
			{p.inline ? (
				<DropdownSelect
					value={value}
					{...field}
					onChange={onChange}
					data={options}
					disabled={state === "disabled"}
					label={p.title}
					wrapperProps={{ className: styles.inline__control }}
				/>
			) : options.length < 5 ? (
				<LabeledSegmentedControl
					value={value}
					{...field}
					onChange={onChange}
					data={options}
					disabled={state === "disabled"}
					label={p.title}
				/>
			) : (
				<Select
					value={value}
					{...field}
					onChange={onChange}
					data={options}
					disabled={state === "disabled"}
					label={p.title}
					style={{ maxWidth: "unset", flex: 1 }}
					allowDeselect={false}
				/>
			)}
			<ParamsMapped
				params={p.variants.find((v) => v.name === value)?.fields}
				prefix={name}
				inline={p.inline}
				render={(children) => {
					if (p.inline) {
						return (
							<Group flex={1} className={styles.inline__item}>
								{children}
							</Group>
						);
					}
					return (
						<Stack ml="md" gap="sm">
							{children}
						</Stack>
					);
				}}
			/>
		</Wrapper>
	);
};
