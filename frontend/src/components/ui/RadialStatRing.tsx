import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { springSnappy, tapPress, transitionFast } from "@/theme/motion";
import { miui } from "@/theme/theme";

type RadialStatRingProps = {
  label: string;
  value: number;
  /** 0–100 fill of the ring */
  percent: number;
  color: string;
  active?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  hint?: string;
  icon?: ReactNode;
  delay?: number;
  /** Ring diameter in px (default 108) */
  ringSize?: number;
  /** Hide caption under the ring */
  hideHint?: boolean;
};

export function RadialStatRing({
  label,
  value,
  percent,
  color,
  active = false,
  interactive = false,
  onClick,
  hint,
  icon,
  delay = 0,
  ringSize = 108,
  hideHint = false,
}: RadialStatRingProps) {
  const size = ringSize;
  const stroke = Math.max(5, Math.round(size * 0.083));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const display = value.toLocaleString();
  const compact = size < 80;

  const Wrapper = interactive ? motion.button : motion.div;

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...transitionFast, delay }}
      whileHover={interactive ? { y: -4, transition: transitionFast } : undefined}
      whileTap={interactive ? tapPress : undefined}
      style={{
        margin: 0,
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: interactive ? "pointer" : "default",
        width: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: compact ? 2 : 3,
          p: compact ? 0.75 : 1.5,
          pt: compact ? 0.65 : 1.25,
          bgcolor: miui.paper,
          border: `1px solid ${active ? alpha(color, 0.45) : miui.border}`,
          boxShadow: active
            ? `0 8px 20px ${alpha(color, 0.16)}`
            : `0 1px 4px ${alpha(miui.text, 0.05)}`,
          transition: "border-color 0.18s ease, box-shadow 0.18s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.35,
            mb: compact ? 0.35 : 0.75,
            minHeight: compact ? 16 : 20,
          }}
        >
          {icon}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: compact ? "0.55rem" : "0.62rem",
              color: active ? color : "text.secondary",
            }}
          >
            {label}
          </Typography>
        </Box>

        <Box sx={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={alpha(miui.text, 0.08)}
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ ...springSnappy, delay: delay + 0.05 }}
            />
          </svg>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              key={display}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={transitionFast}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: compact ? "0.95rem" : "1.25rem",
                  color: active ? color : "text.primary",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {display}
              </Typography>
            </motion.div>
            <Typography
              variant="caption"
              sx={{
                mt: 0.2,
                fontSize: compact ? "0.58rem" : "0.65rem",
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              {Math.round(clamped)}%
            </Typography>
          </Box>
        </Box>

        {hint && !hideHint && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: compact ? 0.5 : 1,
              textAlign: "center",
              fontSize: "0.62rem",
              lineHeight: 1.25,
              px: 0.5,
              minHeight: compact ? 0 : 28,
            }}
          >
            {hint}
          </Typography>
        )}
      </Box>
    </Wrapper>
  );
}
