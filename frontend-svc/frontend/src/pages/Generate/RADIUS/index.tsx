import { zodResolver } from "@hookform/resolvers/zod";
import { batch } from "@legendapp/state";
import { use$, useUnmount } from "@legendapp/state/react";
import { Button, Group, Stack, Tabs } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { type FC, Suspense, useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Await, useAsyncValue, useLoaderData } from "react-router-dom";
import { SuspenseWrapper } from "@/components/Layout/SuspenseWrapper";
import { DefaultLoaderFallback } from "@/components/Loader";
import { useDynamicConfirmation } from "@/components/Modals/Confirmation";
import type { ProtoDefinition } from "@/hooks/generate/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import type { LoaderData } from "../loader";
import { cleanupRadiusAttributes, type RadiusForm } from "./form";
import { FormStateProvider } from "./formStateContext";
import { useAutoProtoSchema } from "./hooks/useAutoSchema";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { useDetectNadFamily } from "./hooks/useNadFamily";
import { ParametersPane } from "./ParametersPane";
import { ProtoDataLoader } from "./ProtoDataLoader";
import { radiusParamsStore$, type Tab } from "./store";
import { ParametersMenu } from "./TabsMenu";

const useProtoDataSet = () => {
	const [, proto] = useAsyncValue() as [unknown, ProtoDefinition | null];

	useEffect(() => {
		if (!proto?.radius) {
			return radiusParamsStore$.radius.protoSpecific.clear;
		}

		batch(() => {
			radiusParamsStore$.radius.protoSpecific.updateProtoSpecific(
				"accessRequest",
				proto.radius.access_request,
			);
			radiusParamsStore$.radius.protoSpecific.updateProtoSpecific(
				"accountingStart",
				proto.radius.accounting_start,
			);
		});
	}, [proto?.radius]);
};

export const RadiusGeneratePage: FC = () => {
	const { defaults, proto } = useLoaderData() as LoaderData;
	const allPromise = useMemo(
		() => Promise.all([defaults, proto]),
		[defaults, proto],
	);

	return (
		<SuspenseWrapper enabled>
			<Suspense fallback={<DefaultLoaderFallback />}>
				<Await resolve={allPromise}>
					<RadiusGeneratePageLoaded />
				</Await>
			</Suspense>
		</SuspenseWrapper>
	);
};

const RadiusGeneratePageLoaded: FC = () => {
	const schema$ = useAutoProtoSchema();

	useProtoDataSet();
	const defaultValues = useDefaultValues();
	const form = useForm<RadiusForm>({
		defaultValues,
		resolver: (...args) => zodResolver(schema$.get()).apply(null, args as any),
		mode: "onBlur",
	});

	const confirm = useDynamicConfirmation();
	const tab = use$(radiusParamsStore$.uiState.tab);
	const [u] = useQueryUser();
	const detectFamily = useDetectNadFamily(u);

	useUnmount(() => {
		radiusParamsStore$.uiState.tab.set("general");
	});

	const onSubmit = form.handleSubmit(
		(values) => {
			const family = detectFamily(values.general.nas.nasIp);
			const clean = cleanupRadiusAttributes(values, family);
			console.log({ clean });
			confirm({
				children: "Are you sure?",
				confirmText: "Yes",
				onConfirm: async () => {
					return new Promise((_resolve, reject) => {
						setTimeout(() => {
							reject(new Error("Some error"));
						}, 5_000);
						return true;
					});
				},
			});
		},
		(errors) => {
			console.log({ errors });
		},
	);

	return (
		<FormStateProvider schema={schema$}>
			<FormProvider {...form}>
				<form onSubmit={onSubmit} style={{ flex: 1, overflow: "auto" }}>
					<Stack gap="sm" pb="md">
						<Tabs
							orientation="vertical"
							value={tab}
							onChange={(value) => {
								if (!value || value === "none") return;
								radiusParamsStore$.uiState.tab.set(value as Tab);
							}}
							pos="relative"
						>
							<Tabs.List>
								<ParametersMenu />
								<ProtoDataLoader />
							</Tabs.List>
							<ParametersPane />
						</Tabs>
						<Group justify="center">
							<Button type="submit" rightSection={<IconSend size={16} />}>
								Start
							</Button>
						</Group>
					</Stack>
				</form>
			</FormProvider>
		</FormStateProvider>
	);
};
