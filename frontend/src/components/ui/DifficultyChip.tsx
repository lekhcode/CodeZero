import { Chip } from "@mui/material";
import { miui, numberFontFamily } from "@/theme/theme";
import { formatDifficulty } from "@/utils/difficulty";

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  EASY: {
    bg: miui.successSoft,
    color: miui.success,
    border: miui.successBorder,
  },
  MEDIUM: {
    bg: miui.cautionSoft,
    color: miui.caution,
    border: miui.cautionBorder,
  },
  HARD: {
    bg: miui.dangerSoft,
    color: miui.danger,
    border: miui.dangerBorder,
  },
  MIXED: {
    bg: miui.accentSoft,
    color: miui.textMuted,
    border: miui.borderStrong,
  },
};

export function DifficultyChip({ difficulty }: { difficulty: string }) {
  const key = difficulty.toUpperCase();
  const style = BADGE_STYLES[key] ?? BADGE_STYLES.MEDIUM!;

  return (
    <Chip
      label={formatDifficulty(difficulty).toUpperCase()}
      size="small"
      sx={{
        bgcolor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontFamily: numberFontFamily,
        fontSize: "11px",
        fontWeight: 500,
        height: "auto",
        py: 0.25,
        px: 0.5,
        borderRadius: "4px",
        letterSpacing: "0.02em",
        "& .MuiChip-label": { px: 0.5, py: 0 },
      }}
    />
  );
}
