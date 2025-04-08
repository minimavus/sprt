import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface DelayedModalStateOptions {
  levelsUp?: number;
}

export function useDelayedModalState({
  levelsUp = 1,
}: DelayedModalStateOptions = {}) {
  const nav = useNavigate();
  const l = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const onClose = useCallback(() => {
    setIsOpen(false);

    let pathUp = "";
    for (let i = 0; i < levelsUp; i++) {
      pathUp += "..";
      if (i < levelsUp - 1) {
        pathUp += "/";
      }
    }

    setTimeout(() => nav(`${pathUp}${l.search}`, { relative: "path" }), 200);
  }, [nav, l.search]);

  const onOpen = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsOpen(true);
      clearTimeout(timeout);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  return { isOpen, onClose, onOpen };
}
