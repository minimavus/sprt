import { type FC } from "react";
import { Badge } from "@mantine/core";

import styles from "./Flow.module.scss";

const formatSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m ` : ""}${
    secs ? `${secs}s` : ""
  }`;
};

const formatTimeDiff = (diff: number) => {
  let seconds = 0,
    milliseconds = 0,
    microseconds = 0;

  if (diff > 0) {
    seconds = Math.floor(diff / 1000000);
    diff -= seconds * 1000000;
    milliseconds = Math.floor((diff % 1000000) / 1000);
    diff -= milliseconds * 1000;
    microseconds = Math.floor(diff % 1000);
  }

  let str = "";
  if (seconds > 0) {
    str += formatSeconds(seconds);
  }
  if (milliseconds > 0) {
    if (str) {
      str += " ";
    }
    str += `${milliseconds}ms`;
  }
  if (microseconds > 0) {
    if (str) {
      str += " ";
    }
    str += `${microseconds}µs`;
  }

  return str;
};

export const TimeDiff: FC<{ diff: number }> = ({ diff }) => {
  if (diff <= 0) {
    return null;
  }

  const str = formatTimeDiff(diff);

  return (
    <div className={styles["time_diff"]}>
      <Badge color="blue.1" size="sm" tt="none" autoContrast>
        {`+ ${str}`}
      </Badge>
    </div>
  );
};
