import type { ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { miui } from "@/theme/theme";
import { transitionFast } from "@/theme/motion";

type AnimatedBannerProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
  /** Primary glow color */
  accent?: string;
  /** Secondary glow color */
  accentSecondary?: string;
  /** Lighter motion for compact strips */
  subtle?: boolean;
};

const orbDriftA = {
  x: [0, 16, 4, 0],
  y: [0, -12, 6, 0],
  transition: { duration: 11, repeat: Infinity, ease: "easeInOut" as const },
};

const orbDriftB = {
  x: [0, -12, 0],
  y: [0, 14, 0],
  transition: { duration: 13, repeat: Infinity, ease: "easeInOut" as const, delay: 0.6 },
};

export function AnimatedBanner({
  children,
  sx,
  accent = miui.primary,
  accentSecondary = miui.accent,
  subtle = false,
}: AnimatedBannerProps) {
  const orbScale = subtle ? 0.75 : 1;
  const orbOpacity = subtle ? 0.1 : 0.16;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: subtle ? 8 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionFast}
      sx={{
        position: "relative",
        overflow: "clip",
        ...sx,
      }}
    >
      <Box
        component={motion.div}
        aria-hidden
        animate={{
          x: ["-120%", "220%"],
        }}
        transition={{
          duration: subtle ? 4 : 3.8,
          repeat: Infinity,
          repeatDelay: subtle ? 5 : 3.5,
          ease: "easeInOut",
        }}
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            105deg,
            transparent 38%,
            ${alpha("#fff", subtle ? 0.08 : 0.14)} 50%,
            transparent 62%
          )`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        component={motion.div}
        aria-hidden
        animate={orbDriftA}
        sx={{
          position: "absolute",
          right: -28 * orbScale,
          top: -28 * orbScale,
          width: 140 * orbScale,
          height: 140 * orbScale,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${accent}, ${accentSecondary})`,
          opacity: orbOpacity,
          filter: "blur(32px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        component={motion.div}
        aria-hidden
        animate={orbDriftB}
        sx={{
          position: "absolute",
          left: -16 * orbScale,
          bottom: -20 * orbScale,
          width: 96 * orbScale,
          height: 96 * orbScale,
          borderRadius: "50%",
          background: accentSecondary,
          opacity: orbOpacity * 0.65,
          filter: "blur(26px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        component={motion.div}
        aria-hidden
        animate={{ scale: [1, 1.06, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        sx={{
          position: "absolute",
          inset: "10% 15%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(accent, 0.2)} 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
