import type { DifficultyLevel } from "@/types/api.types";
import { miui } from "@/theme/theme";

/** Hex values for MUI `sx` / `color` (MUI cannot parse CSS `var()`). */
const COLORS: Record<string, string> = {
  EASY: miui.success,
  MEDIUM: miui.caution,
  HARD: miui.danger,
  MIXED: miui.textMuted,
};

export function difficultyColor(difficulty: string): string {
  return COLORS[difficulty.toUpperCase()] ?? COLORS.MIXED;
}

export function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD", "MIXED"];
