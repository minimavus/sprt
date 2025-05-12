import { type FC } from "react";
import { Button, Code, Fieldset, Stack, Switch, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { DisplayError } from "@/components/Error";
import { useConfig } from "@/hooks/config/useConfig";
import { useNADSourcesAll } from "@/hooks/generate/useNADSources";
import { useQueryUser } from "@/hooks/useQueryUser";
import { isIP } from "@/utils/ip";

import { ListEdit } from "./ListEdit";
import { buildIPMatcher, buildRegexMatcher } from "./matchers";
import { SourcesModal } from "./SourcesModal";

const isIPGuard = isIP();

const IPSourcesPatterns: FC = () => {
  const [u] = useQueryUser();
  const { data: sources } = useNADSourcesAll(u);
  const { data: cfg } = useConfig();
  const { getValues, setError } = useFormContext<{
    generator: {
      "source-ip": {
        exclude: string[];
        allowed: string[];
      };
    };
  }>();

  const showMatchingSources = () => {
    const [exclude, allow] = getValues([
      "generator.source-ip.exclude",
      "generator.source-ip.allowed",
    ]);

    const excludeMatchers = exclude
      .filter(Boolean)
      .map((pattern: string, idx: number) => {
        try {
          return isIPGuard(pattern)
            ? buildIPMatcher(pattern)
            : buildRegexMatcher(pattern);
        } catch (e) {
          setError(`generator.source-ip.exclude.${idx}`, {
            type: "manual",
            message:
              e && typeof e === "object" && "message" in e
                ? (e.message as string)
                : `Invalid pattern: ${pattern}`,
          });
          throw e;
        }
      });
    const allowMatchers = allow.filter(Boolean).map((pattern: string, idx) => {
      try {
        return isIPGuard(pattern)
          ? buildIPMatcher(pattern)
          : buildRegexMatcher(pattern);
      } catch (e) {
        setError(`generator.source-ip.allowed.${idx}`, {
          type: "manual",
          message:
            e && typeof e === "object" && "message" in e
              ? (e.message as string)
              : `Invalid pattern: ${pattern}`,
        });
        throw e;
      }
    });

    let matched = [...sources!];
    if (excludeMatchers.length > 0) {
      matched = matched.filter((source) =>
        excludeMatchers.every((matcher) => !matcher(source.address)),
      );
    }
    if (allowMatchers.length > 0) {
      matched = matched.filter((source) =>
        allowMatchers.some((matcher) => matcher(source.address)),
      );
    }

    const modalId = modals.open({
      title: "Matching sources",
      children: (
        <SourcesModal
          sources={matched}
          close={() => modals.close(modalId)}
          preamble={
            <Text size="sm">
              The following sources match the exclusion and inclusion patterns.
              If no patterns are defined, all sources are shown.
            </Text>
          }
        />
      ),
      size: "lg",
    });
  };

  return (
    <Stack gap="sm">
      <Text size="sm">
        SPRT automatically detects all available source addresses and
        interfaces. The user can then select a source from the resulting list.
        If exclusion patterns are defined, matching sources will be removed from
        the list. If inclusion patterns are defined, only sources that match
        will be included.
      </Text>
      <ListEdit
        label={cfg?.["generator.source-ip.exclude"]?.label}
        name="generator.source-ip.exclude"
      />
      <ListEdit
        label={cfg?.["generator.source-ip.allowed"]?.label}
        name="generator.source-ip.allowed"
      />
      <div>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={showMatchingSources}
        >
          Show matching sources
        </Button>
      </div>
    </Stack>
  );
};

const IPSourcesExplicit: FC = () => {
  const { data: cfg } = useConfig();
  const [u] = useQueryUser();
  const { data: sources } = useNADSourcesAll(u);

  const showAvailableSources = () => {
    const modalId = modals.open({
      title: "Available sources",
      children: (
        <SourcesModal sources={sources!} close={() => modals.close(modalId)} />
      ),
      size: "lg",
    });
  };

  return (
    <Stack gap="sm">
      <Text size="sm">
        Explicit source addresses are used. The user can choose one from a list
        of available sources. The selected address will be set as the
        <Code>NAS-IP-Address</Code> (or <Code>NAS-IPv6-Address</Code>) in RADIUS
        packets. Routing will determine which interface is used for sending.
      </Text>
      <ListEdit
        label={cfg?.["generator.source-ip.explicit-sources"]?.label}
        name="generator.source-ip.explicit-sources"
      />
      <div>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={showAvailableSources}
        >
          Show available sources
        </Button>
      </div>
    </Stack>
  );
};

export const IPSourcesConfig: FC = () => {
  const [u] = useQueryUser();
  const { error, status } = useNADSourcesAll(u);
  const { data: cfg } = useConfig();

  const autoDetect = useWatch({
    name: "generator.source-ip.auto-detect",
  });

  if (status === "pending") return <>Loading IP sources</>;
  if (status === "error") {
    return <DisplayError error={error} before="Failed to load IP sources" />;
  }

  return (
    <Fieldset legend="IP Sources">
      <Stack gap="sm">
        <Controller
          name="generator.source-ip.auto-detect"
          render={({ field, fieldState }) => (
            <Switch
              label={cfg?.["generator.source-ip.auto-detect"]?.label}
              checked={field.value}
              onChange={field.onChange}
              error={fieldState.isTouched && fieldState.error?.message}
            />
          )}
        />
        {autoDetect ? <IPSourcesPatterns /> : <IPSourcesExplicit />}
      </Stack>
    </Fieldset>
  );
};
