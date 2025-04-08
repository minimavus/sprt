import { createContext, use } from "react";

export const BlockContext = createContext<{
  inline?: boolean;
}>({});

export const useIsInline = () => {
  const ctx = use(BlockContext);
  if (!ctx) {
    return false;
  }
  return ctx.inline || false;
};
