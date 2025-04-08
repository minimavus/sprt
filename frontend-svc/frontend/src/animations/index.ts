import type { AnimationProps } from "framer-motion";

export const fadeInClampOut: AnimationProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: { duration: 0.1 },
  },
};

export const tabAnimation: AnimationProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
