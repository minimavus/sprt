import { Flex, type FlexProps } from "@mantine/core";
import { motion } from "framer-motion";
import { forwardRef } from "react";

const forwardedFlex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => (
  <Flex {...props} ref={ref} />
));

export const MotionedFlex = motion.create(forwardedFlex);
