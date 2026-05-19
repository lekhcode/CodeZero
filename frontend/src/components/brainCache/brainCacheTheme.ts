import { dotGridHeroSx, miui } from "@/theme/theme";

/** Brain Cache accents on the dojo dark theme. */
export const bc = {
  accent: miui.accent,
  accentLight: miui.accentSoft,
  accentBorder: miui.accentBorder,
  teal: miui.accent,
  tealLight: miui.accentSoft,
  danger: miui.danger,
  dangerLight: miui.dangerSoft,
  success: miui.success,
  paper: miui.paper,
  border: miui.border,
  text: miui.text,
  muted: miui.textMuted,
  heroSurface: dotGridHeroSx,
} as const;
