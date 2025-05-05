import { createShikiAdapter } from "@mantine/code-highlight";

export const shikiAdapter = createShikiAdapter(loadShiki);

async function loadShiki() {
  const { createHighlighter } = await import("shiki");
  const shiki = await createHighlighter({
    langs: ["tsx", "bash", "json"],
    themes: [],
  });

  return shiki;
}
