import { FC, ReactNode, useMemo } from "react";
import { Button, Collapse, rem, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { differenceInMilliseconds, differenceInSeconds } from "date-fns";

import { KeyValue } from "@/components/KeyValue";
import { FormatTime } from "@/components/Time";
import { Job } from "@/hooks/jobs";

const SessionsCount: FC<{ attributes: NonNullable<Job["attributes"]> }> = ({
  attributes,
}) =>
  typeof attributes.count === "undefined" ? null : (
    <>
      {attributes.count}{" "}
      {typeof attributes.succeeded !== "undefined" &&
      typeof attributes.failed !== "undefined" ? (
        <>
          (
          <Text span c="green">
            {attributes.succeeded}
          </Text>
          {" / "}
          <Text span c="red">
            {attributes.failed}
          </Text>
          )
        </>
      ) : null}
    </>
  );

const JobAction: FC<{ attributes: NonNullable<Job["attributes"]> }> = ({
  attributes,
}) =>
  typeof attributes.action === "undefined" ? null : (
    <>
      <Text span tt="capitalize">
        {attributes.action}
      </Text>{" "}
      {attributes.action == "generate" ? (
        <Text span tt="uppercase">
          ({attributes.protocol})
        </Text>
      ) : null}
    </>
  );

export const JobDetailsCollapse: FC<{ job: Job }> = ({ job }) => {
  const [open, { toggle }] = useDisclosure(false);

  const pairs = useMemo(() => {
    const pairs: [string, ReactNode][] = [];

    if (job.attributes?.finished) {
      let diff: string = `${differenceInSeconds(
        job.attributes.finished,
        job.attributes!.created!,
      )}s`;
      if (
        differenceInMilliseconds(
          job.attributes.finished,
          job.attributes!.created!,
        ) %
          1000 >
        0
      ) {
        diff = `${diff} ${differenceInMilliseconds(job.attributes.finished, job.attributes!.created!) % 1000}ms`;
      }

      pairs.push([
        "Finished",
        <>
          <FormatTime t={job.attributes.finished} />
          <Text span> (in {diff})</Text>
        </>,
      ]);
    }

    if (job.attributes?.server) {
      pairs.push(["Server", job.attributes.server]);
    }

    if (job.attributes) {
      pairs.push(["Sessions", <SessionsCount attributes={job.attributes} />]);
      pairs.push(["Action", <JobAction attributes={job.attributes} />]);
    }

    return pairs;
  }, [job.attributes]);

  return (
    <>
      <Collapse in={open}>
        <KeyValue kw={80} pairs={pairs} justifyKeys="flex-start" gap={rem(4)} />
      </Collapse>

      <div>
        <Button
          onClick={toggle}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ transform: open ? "rotate(-180deg)" : "none" }}
            />
          }
          variant="subtle"
          size="compact-xs"
        >
          {open ? "Hide" : "Show"} Details
        </Button>
      </div>
    </>
  );
};
