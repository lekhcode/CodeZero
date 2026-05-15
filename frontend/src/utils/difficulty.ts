import type { DifficultyLevel } from "@/types/api.types";

const COLORS: Record<string, string> = {
  EASY: "#059669",
  MEDIUM: "#d97706",
  HARD: "#dc2626",
  MIXED: "#6366f1",
};

export function difficultyColor(difficulty: string): string {
  return COLORS[difficulty.toUpperCase()] ?? COLORS.MIXED;
}

export function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD", "MIXED"];
