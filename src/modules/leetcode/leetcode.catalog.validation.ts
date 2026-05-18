import { DifficultyLevel } from "@prisma/client";
import { z } from "zod";

const difficultyValues = [
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
] as const;

function parseCsv(value: string | undefined): string[] | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}

export const catalogMetaQuerySchema = z.object({
  includePremium: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type CatalogMetaQuery = z.infer<typeof catalogMetaQuerySchema>;

export const listProblemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(120).optional(),
  difficulty: z
    .string()
    .optional()
    .transform((raw) => parseCsv(raw))
    .pipe(z.array(z.enum(difficultyValues)).optional()),
  topics: z
    .string()
    .optional()
    .transform((raw) => parseCsv(raw))
    .pipe(z.array(z.string().min(1).max(80)).max(12).optional()),
  includePremium: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  shuffle: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type ListProblemsQuery = z.infer<typeof listProblemsQuerySchema>;
