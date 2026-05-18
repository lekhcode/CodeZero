import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { springSnappy, tapPress, transitionFast } from "@/theme/motion";
import { miui } from "@/theme/theme";

export type AnimatedStatCardProps = {
  label: string;
  value: string;
  accent: string;
  icon?: ReactNode;
  hint?: string;
  active?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  delay?: number;
};

export function AnimatedStatCard({
  label,
  value,
  accent,
  icon,
  hint,
  active = false,
  interactive = false,
  onClick,
  delay = 0,
}: AnimatedStatCardProps) {
  const Wrapper = interactive ? motion.button : motion.div;

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionFast, delay }}
      whileHover={interactive ? { y: -3, transition: transitionFast } : undefined}
      whileTap={interactive ? tapPress : undefined}
      style={{
        margin: 0,
        padding: 0,
        border: "none",
        background: "transparent",
        textAlign: "left",
        cursor: interactive ? "pointer" : "default",
        width: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 2.5,
          p: 1.75,
          minHeight: 88,
          border: `1px solid ${active ? alpha(accent, 0.5) : miui.border}`,
          bgcolor: miui.paper,
          boxShadow: active
            ? `0 8px 24px ${alpha(accent, 0.18)}, 0 0 0 1px ${alpha(accent, 0.08)}`
            : `0 1px 2px ${alpha(miui.text, 0.04)}`,
          transition: "box-shadow 0.18s ease",
        }}
      >
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: active ? 1 : 0,
            scale: active ? 1 : 0.92,
          }}
          transition={springSnappy}
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(145deg, ${alpha(accent, 0.14)} 0%, ${alpha(accent, 0.04)} 55%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: active ? 0.9 : 0,
            height: active ? 3 : 0,
          }}
          transition={springSnappy}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            background: accent,
            borderRadius: "12px 12px 0 0",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, display: "flex", gap: 1.25 }}>
          {icon && (
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              transition={springSnappy}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: alpha(accent, active ? 0.18 : 0.1),
                color: accent,
              }}
            >
              {icon}
            </motion.div>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontSize: "0.62rem",
                color: active ? accent : "text.secondary",
                display: "block",
                transition: "color 0.15s ease",
              }}
            >
              {label}
            </Typography>
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitionFast}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mt: 0.35,
                  color: active ? accent : "text.primary",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {value}
              </Typography>
            </motion.div>
            {hint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5, lineHeight: 1.3, fontSize: "0.68rem" }}
              >
                {hint}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Wrapper>
  );
}
