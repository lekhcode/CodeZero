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
      style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", flex: 1 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
