import { motion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInCardProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Match inner MUI `borderRadius` so enter transition clips to rounded shape. */
  borderRadius?: number | string;
};

export function FadeInCard({ children, delay = 0, className, borderRadius }: FadeInCardProps) {
  const radius =
    borderRadius !== undefined
      ? typeof borderRadius === "number"
        ? `${borderRadius * 8}px`
        : borderRadius
      : undefined;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={
        radius !== undefined
          ? { borderRadius: radius, overflow: "hidden" }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
