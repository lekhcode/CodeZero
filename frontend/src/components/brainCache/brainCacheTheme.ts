import { alpha } from "@mui/material";
import { labAccentGradient, miui } from "@/theme/theme";

/** Brain Cache accents on the app light theme — violet + teal, not a separate dark skin. */
export const bc = {
  accent: "#7C3AED",
  accentLight: alpha("#7C3AED", 0.1),
  accentBorder: alpha("#7C3AED", 0.22),
  teal: miui.accent,
  tealLight: alpha(miui.accent, 0.1),
  danger: "#EF4444",
  dangerLight: alpha("#EF4444", 0.08),
  success: "#22C55E",
  paper: miui.paper,
  border: miui.border,
  text: miui.text,
  muted: miui.textMuted,
  gradient: `linear-gradient(135deg, ${alpha("#7C3AED", 0.12)} 0%, ${alpha(miui.accent, 0.08)} 50%, ${miui.paper} 100%)`,
  heroGradient: labAccentGradient,
} as const;
