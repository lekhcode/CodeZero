import { Chip } from "@mui/material";
import { difficultyColor, formatDifficulty } from "@/utils/difficulty";

export function DifficultyChip({ difficulty }: { difficulty: string }) {
  const color = difficultyColor(difficulty);
  return (
    <Chip
      label={formatDifficulty(difficulty)}
      size="small"
      sx={{
        bgcolor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        fontWeight: 700,
      }}
    />
  );
}
