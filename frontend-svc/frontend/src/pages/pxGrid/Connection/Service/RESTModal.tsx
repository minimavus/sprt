import { CodeHighlight } from "@mantine/code-highlight";
import {
  Button,
  Code,
  type ComboboxData,
  Group,
  Select,
  Stack,
  Tabs,
  TagsInput,
  Text,
  TextInput,
} from "@mantine/core";
import { type FC, useState } from "react";
import {
  Controller,
  FormProvider,
  useController,
  useForm,
} from "react-hook-form";
import { useParams } from "react-router-dom";

import { Warning } from "@/components/Alerts";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import {
  isPxGridRestResponseDetails,
  type PxGridRestParam,
  type PxGridRestResponse,
  type PxGridService,
  type PxGridServiceNode,
} from "@/hooks/pxgrid/schemas";
import {
  usePxGridConnectionService,
  usePxGridConnectionServiceRest,
} from "@/hooks/pxgrid/services";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage, maybeError } from "@/utils/errors";

type ActionsProps = {
  serviceName: string;
  service: PxGridService;
};

const selectOptionsFromEnum = (enumValues: string[]): ComboboxData =>
  enumValues.map((value) => ({ label: value, value }));

const ParamSelect: FC<{ param: PxGridRestParam; name: string }> = ({
  param,
  name,
}) => {
  const { field, fieldState } = useController({ name });

  return (
    <Select
      data={selectOptionsFromEnum(param.schema!.enum!)}
      {...field}
      error={maybeError(fieldState.error)}
      clearable
      label={param.name}
    />
  );
};

const ArrayInput: FC<{ param: PxGridRestParam; name: string }> = ({
  param,
  name,
}) => {
  const { field } = useController<{ [x: typeof name]: any[] }>({
    name,
  });

  return (
    <TagsInput
      {...field}
      label={param.name}
      data={param.schema?.items?.enum}
      placeholder={
        param.schema?.items?.enum
          ? "Select values or type to add"
          : "Type to add"
      }
    />
  );
};

const RESTParamInput: FC<{ param: PxGridRestParam; name: string }> = ({
  param,
  name,
}) => {
  useController({ name: `${name}.name`, defaultValue: param.name });

  const valueInputName = `${name}.value`;
  if (param.schema?.type === "string" && param.schema?.enum) {
    return <ParamSelect param={param} name={valueInputName} />;
  }

  if (param.schema?.type === "array") {
    return <ArrayInput param={param} name={valueInputName} />;
  }

  return (
    <Controller
      key={param.name}
      name={valueInputName}
      render={({ field, fieldState: { error } }) => (
        <TextInput
          {...field}
          type={param.schema?.type === "integer" ? "number" : "text"}
          placeholder={param.name}
          label={param.name}
          description={param.schema?.$comment}
          error={maybeError(error)}
        />
      )}
    />
  );
};

const RESTResponse: FC<{ response?: PxGridRestResponse }> = ({ response }) => {
  if (!isPxGridRestResponseDetails(response?.json_response)) {
    return (
      <Stack gap="sm">
        <Stack
          style={{ maxHeight: "400px", overflow: "auto", maxWidth: "100%" }}
        >
          <Code lang="json" block>
            {JSON.stringify(response, null, 2)}
          </Code>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Group gap="xs">
        <Text span fw="bold">
          Status:
        </Text>
        <Code>{response.json_response.StatusCode}</Code>
      </Group>
      {response.json_response.Body ? (
        <>
          <Group justify="space-between">
            <Text span fw="bold">
              Body:
            </Text>
            <CopyToClipboard
              value={JSON.stringify(response.json_response.Body)}
              copyLabel="Copy response body"
              tooltipPosition="top"
            />
          </Group>
          <Stack
            style={{ maxHeight: "400px", overflow: "auto", maxWidth: "100%" }}
          >
            <CodeHighlight
              language="json"
              code={JSON.stringify(response.json_response.Body, null, 2)}
              withCopyButton={false}
            />
          </Stack>
        </>
      ) : (
        <Text>No response body</Text>
      )}
    </Stack>
  );
};

const optionsFromNodes = (nodes: PxGridServiceNode[]): ComboboxData =>
  nodes.map((node) => ({ label: node.node_name, value: node.node_name }));

const NodeSelector: FC = () => {
  const { id, service } = useParams<{ id: string; service: string }>();
  const [user] = useQueryUser();
  const { data } = usePxGridConnectionService(id!, user, service!);

  if (!data?.lookup?.nodes?.length) {
    return (
      <Warning>
        No nodes are available for this service. Please perform a service lookup
        to select a node.
      </Warning>
    );
  }

  return (
    <Controller
      name="node"
      render={({ field, fieldState: { error } }) => (
        <Select
          {...field}
          data={optionsFromNodes(data!.lookup!.nodes!)}
          label="Node"
          clearable
          onClear={() => field.onChange(undefined)}
          error={getErrorMessage(error)}
        />
      )}
    />
  );
};

const Form: FC<{
  rest: NonNullable<PxGridService>["rest"][number];
}> = ({ rest }) => {
  const { id, service } = useParams<{ id: string; service: string }>();
  const [user] = useQueryUser();
  const { mutateAsync: execute } = usePxGridConnectionServiceRest(id!, user);

  const [response, setResponse] = useState<PxGridRestResponse>();
  const [activeTab, setActiveTab] = useState<"params" | "response">("params");

  const form = useForm<{ params: any[] }>();
  const onSubmit = form.handleSubmit(async (data) => {
    const r = await execute({
      service: service!,
      method: rest.name,
      ...data,
    });
    setResponse(r);
    setActiveTab("response");
  });

  return (
    <>
      <Tabs value={activeTab}>
        <Tabs.List>
          <Tabs.Tab value="params" onClick={() => setActiveTab("params")}>
            Parameters
          </Tabs.Tab>
          <Tabs.Tab
            value="response"
            onClick={response ? () => setActiveTab("response") : undefined}
            disabled={!response}
          >
            Response
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {activeTab === "params" ? (
        <FormProvider {...form}>
          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              {rest.params.length > 0 ? (
                rest.params.map((param, idx) => (
                  <RESTParamInput
                    key={param.name}
                    param={param}
                    name={`params.${idx}`}
                  />
                ))
              ) : (
                <Text>No parameters for this method</Text>
              )}
              <NodeSelector />
              <Button
                type="submit"
                loading={
                  form.formState.isSubmitting || form.formState.isLoading
                }
              >
                Send
              </Button>
            </Stack>
          </form>
        </FormProvider>
      ) : (
        <RESTResponse response={response} />
      )}
    </>
  );
};

const RESTMethodSelect: FC<{
  service: PxGridService;
  selected: string | null;
  onChange: (value: string) => void;
}> = ({ service, selected, onChange }) => {
  return (
    <Tabs orientation="vertical" value={selected}>
      <Tabs.List>
        {service.rest.map((rest) => (
          <Tabs.Tab
            key={rest.name}
            onClick={() => onChange(rest.name)}
            value={rest.name}
          >
            {rest.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
};

export const RESTModalBody: FC<ActionsProps> = ({ service }) => {
  const [method, setMethod] = useState<string | null>(null);
  const rest = service.rest.find((r) => r.name === method);

  return (
    <Group
      gap="sm"
      style={{ overflow: "hidden" }}
      wrap="nowrap"
      align="flex-start"
    >
      <RESTMethodSelect
        service={service}
        selected={method}
        onChange={setMethod}
      />
      <Stack gap="sm" flex={1}>
        {rest ? (
          <Form rest={rest} key={method} />
        ) : (
          <Text>Choose a method</Text>
        )}
      </Stack>
    </Group>
  );
};
