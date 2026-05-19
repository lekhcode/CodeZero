import { z } from "zod";

const timezoneSchema = z.string().trim().min(1).max(64).optional();

export const logAutoRevisionBodySchema = z.object({
  userId: z.string().uuid().optional(),
  problemId: z.string().uuid(),
  problemTitle: z.string().trim().min(1).max(300).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  solvedAt: z.coerce.date().optional(),
  timezone: timezoneSchema,
});

export const weekQuerySchema = z.object({
  weekOffset: z.coerce.number().int().min(-52).max(52).optional().default(0),
  timezone: timezoneSchema,
});

export const monthQuerySchema = z.object({
  monthOffset: z.coerce.number().int().min(-24).max(24).optional().default(0),
  timezone: timezoneSchema,
});

export const todayQuerySchema = z.object({
  timezone: timezoneSchema,
});

export const summaryQuerySchema = z.object({
  timezone: timezoneSchema,
});

export const revisionIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type LogAutoRevisionBody = z.infer<typeof logAutoRevisionBodySchema>;
