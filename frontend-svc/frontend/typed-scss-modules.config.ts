import path from "node:path";
import type { default as TSM } from "typed-scss-modules";

type Config = Parameters<typeof TSM>[1];

export const config = {
  aliases: {
    "include-media": "include-media/dist/_include-media",
  },
  banner: "// Generated file, DO NOT EDIT. Check DEV.md on how to regenerate",
  nameFormat: "none",
  exportType: "default",
  quoteType: "double",
  includePaths: [
    path.resolve(__dirname, "node_modules"),
    path.resolve(__dirname, "src/styles"),
    path.resolve(__dirname, "src"),
  ],
  additionalData: `@use "${path.join(process.cwd(), "src/_mantine").replace(/\\/g, "/")}" as mantine;`,
} as Config;
