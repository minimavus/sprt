import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FC,
  type Ref,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Code,
  Collapse,
  Grid,
  Group,
  LoadingOverlay,
  Menu,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure, useResizeObserver } from "@mantine/hooks";
import {
  IconChevronDown,
  IconDeviceFloppy,
  IconRestore,
} from "@tabler/icons-react";
import {
  Controller,
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { Info } from "@/components/Alerts";
import { LabeledSegmentedControl } from "@/components/Inputs/LabeledSegmentedControl";
import { PageLayout } from "@/components/Layout/PageLayout";
import { useHostName } from "@/hooks/settings/global";
import {
  SMSGatewaySettingsResponseValue,
  useSMSGatewayExamples,
  useSMSGatewaySettings,
  useSMSGatewaySettingsUpdate,
} from "@/hooks/settings/sms";
import { useQueryUser } from "@/hooks/useQueryUser";
import { useUser } from "@/hooks/useUser";
import { getErrorMessage } from "@/utils/errors";

import { formSchema, methodOptions, SMSSettingsFormData } from "./schema";
import { SMSGatewayResult } from "./SMSGatewayResult";
import type { SMSGatewayConfigRef, SMSSettingsTabs } from "./types";
import {
  formValuesToServerData,
  getURLPrefix,
  serverDataToFormValues,
} from "./utils";

const URLEdit: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController({ name: "url" });
  const [ref, { width }] = useResizeObserver();
  const { data: hostName, isLoading: loadingHostName } = useHostName();
  const [user] = useQueryUser();
  const { data: userData } = useUser();

  return (
    <TextInput
      label="SMS gateway URL"
      {...field}
      error={getErrorMessage(error)}
      leftSection={
        <Text ref={ref} size="sm">
          {loadingHostName
            ? "Loading..."
            : `http(s)://${getURLPrefix(hostName!, user ?? userData?.UserID)}`}
        </Text>
      }
      leftSectionWidth={width + 12}
    />
  );
};

const PostBodyEdit: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController({ name: "body" });

  const method = useWatch({ name: "method" });

  return (
    <Textarea
      label="Body template (for POST method)"
      {...field}
      error={getErrorMessage(error)}
      rows={5}
      disabled={method !== "post"}
    />
  );
};

const MessageTemplateEdit: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController({ name: "messageTemplate" });

  return (
    <Textarea
      label="$message$ template"
      {...field}
      error={getErrorMessage(error)}
      rows={5}
    />
  );
};

const ContentTypeEdit: FC = () => {
  const {
    field,
    fieldState: { error },
  } = useController({ name: "contentType" });

  const method = useWatch({ name: "method" });

  return (
    <Collapse in={method === "post"}>
      <TextInput
        label="Content-Type"
        {...field}
        error={getErrorMessage(error)}
      />
    </Collapse>
  );
};

const AuthConfig: FC = () => {
  const { field } = useController({ name: "requireAuth" });

  return (
    <>
      <Switch {...field} label="Require authentication" />
      <Collapse in={field.value}>
        <Grid gutter="xs">
          <Grid.Col span={6}>
            <Controller
              name="auth.username"
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  label="Username"
                  {...field}
                  error={getErrorMessage(error)}
                />
              )}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Controller
              name="auth.password"
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  label="Password"
                  {...field}
                  error={getErrorMessage(error)}
                />
              )}
            />
          </Grid.Col>
        </Grid>
      </Collapse>
    </>
  );
};

const LoadExampleDropdown: FC = () => {
  const [isMenuOpen, { open, close }] = useDisclosure();
  const { data, isLoading, error } = useSMSGatewayExamples();
  const { setValue } = useFormContext();

  const applyExample = (example: SMSGatewaySettingsResponseValue) => {
    setValue("method", example.method, { shouldDirty: true });
    setValue("url", example.url, { shouldDirty: true });
    setValue("body", example.body_template, { shouldDirty: true });
    setValue("messageTemplate", example.message_template, {
      shouldDirty: true,
    });
    setValue("contentType", example.content_type, { shouldDirty: true });
  };

  return (
    <div>
      <Menu onOpen={open} onClose={close}>
        <Menu.Target>
          <Button
            variant="subtle"
            size="compact-sm"
            rightSection={
              <IconChevronDown
                size={14}
                style={{ transform: isMenuOpen ? "rotate(-180deg)" : "none" }}
              />
            }
          >
            Load example
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Examples</Menu.Label>
          {isLoading ? (
            <Menu.Item disabled>Loading...</Menu.Item>
          ) : error ? (
            <Menu.Item disabled>Error: {getErrorMessage(error)}</Menu.Item>
          ) : (
            data?.map((example) => (
              <Menu.Item
                key={example.title}
                onClick={() => applyExample(example.value)}
              >
                {example.title}
              </Menu.Item>
            ))
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
};

const HelpSection: FC = () => {
  return (
    <Info>
      <Text>
        These variables should be specified either in URL, body or $message$
        template so SPRT will be able to parse credentials:
      </Text>
      <Text>
        <Text span fw="bold">
          $username$
        </Text>{" "}
        - for the guest username
      </Text>
      <Text>
        <Text span fw="bold">
          $password$
        </Text>{" "}
        - for the guest password
      </Text>
      <Text>
        <Text span fw="bold">
          $phone$
        </Text>{" "}
        - for the mobile number
      </Text>
      <Text>
        <Text span fw="bold">
          $message$
        </Text>{" "}
        - to specify where $message$ should be
      </Text>
      <Text>Variables will be replaced with these Regular Expressions:</Text>
      <ul>
        <li>
          <Code>{"(?<username>[^\\s]+)"}</Code>
        </li>
        <li>
          <Code>{"(?<password>[^\\s]+)"}</Code>
        </li>
        <li>
          <Code>{"(?<phone>[^\\s]+)"}</Code>
        </li>
        <li>
          <Code>{"(?<message>.+)"}</Code>
        </li>
      </ul>
      <Text>
        Named capturing groups are used. Names of the groups must be as above.
      </Text>
      <Text>
        If you are sure about Regular Expressions you may use them instead of
        variables.
      </Text>
    </Info>
  );
};

const SMSGatewayConfig: FC<{ ref?: Ref<SMSGatewayConfigRef> }> = ({ ref }) => {
  const [user] = useQueryUser();
  const { data, isLoading } = useSMSGatewaySettings(user);
  const { mutateAsync } = useSMSGatewaySettingsUpdate(user);

  const form = useForm<SMSSettingsFormData>({
    defaultValues: {
      method: "get",
      url: "",
      body: "",
      messageTemplate: "",
      contentType: "",
      requireAuth: false,
      auth: {
        username: "",
        password: "",
      },
    },
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (data && !form.formState.isDirty) {
      form.reset(serverDataToFormValues(data));
    }
  }, [data, form]);

  const onSubmit = form.handleSubmit((data) =>
    mutateAsync(formValuesToServerData(data)),
  );

  useImperativeHandle(
    ref,
    () => ({
      isSaved: () => form.formState.isSubmitted || !form.formState.isDirty,
      getValues: () => form.getValues(),
    }),
    [form],
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <Stack gap="sm" pos="relative">
          <LoadingOverlay visible={isLoading} loaderProps={{ type: "dots" }} />
          <Title order={3}>SMS Gateway Configuration</Title>
          <Grid gutter="xs">
            <Grid.Col span={2}>
              <Controller
                name="method"
                render={({ field }) => (
                  <LabeledSegmentedControl
                    label="Method"
                    data={methodOptions}
                    {...field}
                    fullWidth
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={10}>
              <URLEdit />
            </Grid.Col>
          </Grid>
          <Grid gutter="xs">
            <Grid.Col span={6}>
              <PostBodyEdit />
            </Grid.Col>
            <Grid.Col span={6}>
              <MessageTemplateEdit />
            </Grid.Col>
          </Grid>
          <ContentTypeEdit />
          <AuthConfig />
          <LoadExampleDropdown />
          <HelpSection />
          <Group justify="end">
            <Button
              variant="default"
              type="button"
              onClick={() => form.reset()}
              disabled={!form.formState.isDirty}
              loading={form.formState.isSubmitting}
              leftSection={<IconRestore size={16} />}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={!form.formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
};

const SMSSettings: FC = () => {
  const [tab, setTab] = useState<SMSSettingsTabs>("config");
  const formRef = useRef<SMSGatewayConfigRef>(null);

  return (
    <Tabs
      defaultValue="config"
      value={tab}
      orientation="vertical"
      onChange={(v) => setTab((v ?? "config") as SMSSettingsTabs)}
      flex={1}
    >
      <Tabs.List pt="md" pb="md">
        <Tabs.Tab key="config" value="config">
          Configuration
        </Tabs.Tab>
        <Tabs.Tab key={"result"} value={"result"}>
          Result
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="config" p="md" flex={1}>
        <SMSGatewayConfig ref={formRef} />
      </Tabs.Panel>
      <Tabs.Panel value="result" p="md" flex={1}>
        <SMSGatewayResult formRef={formRef} active={tab === "result"} />
      </Tabs.Panel>
    </Tabs>
  );
};

const HOC: FC = () => {
  return (
    <PageLayout title="Mock SMS Server" suspense fullHeight={false}>
      <SMSSettings />
    </PageLayout>
  );
};

export { HOC as SMSSettings };
