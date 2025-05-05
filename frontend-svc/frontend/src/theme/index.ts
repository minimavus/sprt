import {
  AccordionControl,
  Anchor,
  Card,
  createTheme,
  MantineColorsTuple,
  Menu,
  Switch,
  Tabs,
  TabsTab,
  Text,
  Tooltip,
} from "@mantine/core";

import tabsStyles from "./tabs.module.scss";

import "./tabsVariants.d";

const accent1: MantineColorsTuple = [
  "#ecf4ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc0",
  "#5f7cb7",
  "#5474b4",
  "#44639f",
  "#3a5890",
  "#2c4b80",
];

const accent2: MantineColorsTuple = [
  "#ffe9f6",
  "#ffd1e6",
  "#faa1c9",
  "#f66eab",
  "#f24391",
  "#f02981",
  "#f01879",
  "#d60867",
  "#c0005c",
  "#a9004f",
];

const accent3: MantineColorsTuple = [
  "#fff0e4",
  "#ffe0cf",
  "#fac0a1",
  "#f69e6e",
  "#f28043",
  "#f06e27",
  "#f06418",
  "#d6530c",
  "#bf4906",
  "#a73c00",
];

const accent4: MantineColorsTuple = [
  "#faedff",
  "#edd9f7",
  "#d8b1ea",
  "#c186dd",
  "#ae62d2",
  "#a34bcb",
  "#9d3fc9",
  "#8931b2",
  "#7a2aa0",
  "#6b218d",
];

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  fontFamilyMonospace: "Roboto Mono, monospace",
  components: {
    Switch: Switch.extend({
      defaultProps: {
        withThumbIndicator: false,
      },
    }),
    Anchor: Anchor.extend({
      defaultProps: {
        size: "sm",
      },
    }),
    Text: Text.extend({
      defaultProps: {
        size: "sm",
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        openDelay: 500,
      },
    }),
    Menu: Menu.extend({
      defaultProps: {
        shadow: "md",
      },
    }),
    Card: Card.extend({
      defaultProps: {
        shadow: "sm",
        radius: "md",
      },
    }),
    TabsTab: TabsTab.extend({
      defaultProps: {
        className: tabsStyles.highlight,
      },
    }),
    Tabs: Tabs.extend({
      defaultProps: {
        "data-highlight": true,
      },
      vars: (_theme, props) => {
        if (props["data-highlight"] && props.variant === "default") {
          return {
            root: {
              "--var-tab-color-active-light": "var(--mantine-color-blue-8)",
              "--var-tab-color-active-dark": "var(--mantine-color-blue-1)",
              "--var-tab-background-active-light":
                "var(--mantine-color-blue-0)",
              "--var-tab-background-active-dark": "rgba(24, 100, 171, 0.45)",
              "--var-tab-font-weight-active": "500",
            } as any,
          };
        }
        return { root: {} };
      },
    }),
    AccordionControl: AccordionControl.extend({
      defaultProps: {
        styles: {
          control: {
            paddingInline: "var(--mantine-spacing-sm)",
          },
          label: {
            paddingTop: "var(--mantine-spacing-xs)",
            paddingBottom: "var(--mantine-spacing-xs)",
            fontSize: "var(--mantine-font-size-sm)",
          },
        },
      },
    }),
  },
  colors: {
    accent1,
    accent2,
    accent3,
    accent4,
  },
});
