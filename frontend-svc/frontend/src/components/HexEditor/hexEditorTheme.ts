import {
  alpha,
  getThemeColor,
  MantineColorScheme,
  MantineTheme,
  rem,
} from "@mantine/core";
import { HexEditorTheme } from "react-hex-editor/themes";

export const getHexEditorTheme = (
  theme: MantineTheme,
  colorScheme: MantineColorScheme,
): HexEditorTheme => {
  const odd =
    colorScheme === "dark"
      ? getThemeColor("dark.5", theme)
      : getThemeColor("gray.0", theme);

  const selectionBg =
    colorScheme === "dark"
      ? getThemeColor("blue.9", theme)
      : getThemeColor("blue.3", theme);

  const selectionCursorBg =
    colorScheme === "dark"
      ? getThemeColor("blue.7", theme)
      : getThemeColor("blue.4", theme);

  const selectionText =
    colorScheme === "dark"
      ? getThemeColor("gray.0", theme)
      : getThemeColor("gray.9", theme);

  const inactiveSelectionBg =
    colorScheme === "dark"
      ? getThemeColor("gray.9", theme)
      : getThemeColor("dark.0", theme);

  const inactiveSelectionText =
    colorScheme === "dark"
      ? getThemeColor("gray.0", theme)
      : getThemeColor("gray.9", theme);

  const labelBg =
    colorScheme === "dark"
      ? getThemeColor("dark.8", theme)
      : getThemeColor("gray.1", theme);

  return {
    asciiPaddingX: 0,
    bytePaddingX: rem("0.125rem"),
    rowPaddingY: rem("0.1rem"),
    colorBackground: "var(--input-bg)",
    colorBackgroundEven: "var(--input-bg)",
    colorBackgroundCursor: "var(--mantine-color-blue-light)",
    colorBackgroundCursorHighlight: alpha("#228be6", 0.5),
    colorBackgroundColumnEven: "var(--input-bg)",
    colorBackgroundColumnOdd: odd,
    colorBackgroundInactiveCursor: "var(--mantine-color-yellow-light)",
    colorBackgroundInactiveCursorHighlight: "var(--mantine-color-yellow-light)",
    colorBackgroundInactiveSelection: inactiveSelectionBg,
    colorBackgroundInactiveSelectionCursor: inactiveSelectionBg,
    colorBackgroundLabel: labelBg,
    colorBackgroundLabelCurrent: labelBg,
    colorBackgroundOdd: odd,
    colorBackgroundRowEven: "var(--input-bg)",
    colorBackgroundRowOdd: odd,
    colorBackgroundSelection: selectionBg,
    colorBackgroundSelectionCursor: selectionCursorBg,
    colorScrollbackTrack: "var(--input-bg)",
    colorScrollbackThumb: "var(--mantine-color-placeholder)",
    colorScrollbackThumbHover: inactiveSelectionBg,
    colorText: "var(--mantine-color-text)",
    colorTextEven: "var(--mantine-color-text)",
    colorTextCursor: "var(--mantine-color-blue-text)",
    colorTextCursorHighlight: "var(--mantine-color-blue-text)",
    colorTextColumnEven: "var(--mantine-color-text)",
    colorTextColumnOdd: "var(--mantine-color-text)",
    colorTextInactiveCursor: getThemeColor("yellow.8", theme),
    colorTextInactiveCursorHighlight: getThemeColor("yellow.8", theme),
    colorTextInactiveSelection: inactiveSelectionText,
    colorTextInactiveSelectionCursor: inactiveSelectionText,
    colorTextLabel: "var(--mantine-color-dimmed)",
    colorTextLabelCurrent: "var(--mantine-color-anchor)",
    colorTextOdd: "var(--mantine-color-text)",
    colorTextRowEven: "var(--mantine-color-text)",
    colorTextRowOdd: "var(--mantine-color-text)",
    colorTextSelection: selectionText,
    colorTextSelectionCursor: "var(--mantine-color-bright)",
    fontFamily: theme.fontFamilyMonospace,
    fontSize: theme.fontSizes.sm,
    gutterWidth: rem("0.7rem"),
    cursorBlinkSpeed: "0.7s",
    labelPaddingX: rem("0.5rem"),
    scrollWidth: "auto",
    textTransform: "uppercase",
  };
};
