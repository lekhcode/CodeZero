import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Wrapper avoids `component={motion.div}` on MUI — `transition` prop conflicts crash React. */
export function MotionFadeIn({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
