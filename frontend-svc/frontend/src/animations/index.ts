import type { MotionNodeAnimationOptions } from "framer-motion";

export const fadeInClampOut: MotionNodeAnimationOptions = {
  initial: { opacity: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: { duration: 0.1 },
  },
};

export const tabAnimation: MotionNodeAnimationOptions = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
