import { useEffect, useRef } from "react";

export function useBodyRoot() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    ref.current = document.body;
    return () => {
      ref.current = null;
    };
  }, [ref]);

  return ref;
}
