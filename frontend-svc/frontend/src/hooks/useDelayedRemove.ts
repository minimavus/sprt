import { useEffect } from "react";
import { usePresence } from "framer-motion";

export const useDelayedRemove = (): boolean => {
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    !isPresent && setTimeout(safeToRemove, 300);
  }, [isPresent]);

  return isPresent;
};
