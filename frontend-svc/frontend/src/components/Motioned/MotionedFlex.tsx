import { forwardRef } from "react";
import { Flex, FlexProps } from "@mantine/core";
import { motion } from "framer-motion";

const forwardedFlex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => (
  <Flex {...props} ref={ref} />
));

export const MotionedFlex = motion.create(forwardedFlex);
