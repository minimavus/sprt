import { FC } from "react";
import {
  Box,
  BoxComponentProps,
  PolymorphicComponentProps,
} from "@mantine/core";

import { Variant } from "./types";

export const Background: FC<
  Omit<PolymorphicComponentProps<"svg", BoxComponentProps>, "variant"> & {
    variant?: Variant;
  }
> = ({ __vars, style, variant = "info", ...props }) => {
  const xmlAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    version: "1.1",
    xmlnsXlink: "http://www.w3.org/1999/xlink",
  };

  let stateColor: string, stateBg: string;
  if (variant === "negative") {
    stateColor = "var(--mantine-color-red-light-color)";
    stateBg = "var(--mantine-color-red-light)";
  } else {
    stateColor = "var(--mantine-color-indigo-light-color)";
    stateBg = "var(--mantine-color-indigo-light)";
  }

  return (
    <Box
      component="svg"
      viewBox="0 0 900.07 580.1"
      {...xmlAttributes}
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
        opacity: 0.4,
        ...style,
      }}
      __vars={{
        "--state-color": stateColor,
        "--state-bg": stateBg,
        ...__vars,
      }}
      {...props}
    >
      <path
        d="M548 513s-168-204 20-256 254 160 382 166 278-80 318-80 112 4 108 74-56 134-58 168 46 126 54 148 18 84-26 88c-22.52 2-151 27-325-24-131.67-38.59-337.76 28-385.81 28a74.9 74.9 0 0 1-43.45-13.76C556.44 786.13 500.27 723.06 550 593c26-68-2-80-2-80Z"
        style={{ fill: "var(--state-bg)" }}
        transform="translate(-478.92 -248.8)"
      ></path>
      <circle
        cx="237.08"
        cy="246.2"
        r="51"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="175.08"
        cy="255.2"
        r="34"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="291.08"
        cy="256.2"
        r="33"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="702.08"
        cy="402.2"
        r="51"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="639.08"
        cy="407.2"
        r="34"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="758.08"
        cy="411.2"
        r="33"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="152.08"
        cy="470.2"
        r="34"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <circle
        cx="192.08"
        cy="476.2"
        r="24"
        style={{ fill: "var(--mantine-color-body)" }}
      ></circle>
      <path
        d="M712 643s23-29 47 3c0 0 23-34 37-5M656 616.85S672.52 596 689.75 619c0 0 16.52-24.42 26.57-3.59M1189 455.85s16.52-20.83 33.75 2.15c0 0 16.52-24.42 26.57-3.59M549 353.85S565.52 333 582.75 356c0 0 16.52-24.42 26.57-3.59"
        style={{
          fill: "none",
          stroke: "var(--state-color)",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "5px",
        }}
        transform="translate(-478.92 -248.8)"
      ></path>
    </Box>
  );
};
