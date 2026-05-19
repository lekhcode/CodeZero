import type { DifficultyLevel } from "@/types/api.types";

const COLORS: Record<string, string> = {
  EASY: "#4ADE80",
  MEDIUM: "#F6C360",
  HARD: "#FC8181",
  MIXED: "#9B7FEA",
};

export function difficultyColor(difficulty: string): string {
  return COLORS[difficulty.toUpperCase()] ?? COLORS.MIXED;
}

export function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD", "MIXED"];
