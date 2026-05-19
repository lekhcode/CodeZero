import { Chip } from "@mui/material";
import { formatDifficulty } from "@/utils/difficulty";

const BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  EASY: {
    bg: "rgba(74, 222, 128, 0.07)",
    color: "#4ADE80",
    border: "rgba(74, 222, 128, 0.16)",
  },
  MEDIUM: {
    bg: "rgba(246, 195, 96, 0.07)",
    color: "#F6C360",
    border: "rgba(246, 195, 96, 0.16)",
  },
  HARD: {
    bg: "rgba(252, 129, 129, 0.07)",
    color: "#FC8181",
    border: "rgba(252, 129, 129, 0.16)",
  },
  MIXED: {
    bg: "rgba(155, 127, 234, 0.07)",
    color: "#9B7FEA",
    border: "rgba(155, 127, 234, 0.16)",
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
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: "11px",
        fontWeight: 400,
        height: "auto",
        py: 0.25,
        px: 0.5,
        borderRadius: "4px",
        letterSpacing: "0.04em",
        "& .MuiChip-label": { px: 0.5, py: 0 },
      }}
    />
  );
}
