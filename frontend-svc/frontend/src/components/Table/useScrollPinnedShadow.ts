import { useEffect, useRef, useState } from "react";

export function useScrollPinnedShadow(enabled: boolean) {
  const [leftScrollShadow, setLeftScrollShadow] = useState(false);
  const [rightScrollShadow, setRightScrollShadow] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current || !enabled) {
        return;
      }

      if (containerRef.current.scrollLeft > 0) {
        setLeftScrollShadow(true);
      } else {
        setLeftScrollShadow(false);
      }

      const maxScrollLeft =
        containerRef.current.scrollWidth - containerRef.current.clientWidth;
      if (containerRef.current.scrollLeft === maxScrollLeft) {
        setRightScrollShadow(false);
      } else {
        setRightScrollShadow(true);
      }
    };

    containerRef.current?.addEventListener("scroll", onScroll);

    return () => {
      containerRef.current?.removeEventListener("scroll", onScroll);
    };
  }, []);

  return [containerRef, { leftScrollShadow, rightScrollShadow }] as const;
}
