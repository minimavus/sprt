import { FC, RefAttributes } from "react";
import { useMantineColorScheme, useMantineTheme } from "@mantine/core";
import cx from "classnames";
import HexEditor from "react-hex-editor";
import {
  AutoSizeHexEditorProps,
  HexEditorHandle,
} from "react-hex-editor/dist/types";

import hexEditorStyles from "./HexEditor.module.scss";
import { getHexEditorTheme } from "./hexEditorTheme";

type StyledHexEditorProps = AutoSizeHexEditorProps &
  RefAttributes<HexEditorHandle> & {
    data: Uint8Array<ArrayBufferLike>;
    linesCount?: number;
    id?: string;
    name?: string;
  };

const StyledHexEditor: FC<StyledHexEditorProps> = ({
  data,
  linesCount = 0,
  ...props
}) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = getHexEditorTheme(useMantineTheme(), colorScheme);
  const height = Math.min(400, (linesCount + 1) * 25);

  return (
    <HexEditor
      columns={0x10}
      data={data}
      showAscii
      showColumnLabels
      showRowLabels
      theme={{ hexEditor: theme }}
      height={height}
      className={cx(hexEditorStyles.hex_editor, {
        [hexEditorStyles.empty]: !data.length,
      })}
      rowHeight={25}
      {...props}
    />
  );
};

export { StyledHexEditor as HexEditor };
