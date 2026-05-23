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

export const feedQuerySchema = z.object({
  timezone: timezoneSchema,
  status: z.enum(["pending", "completed", "all"]).optional().default("pending"),
  period: z.enum(["all", "today", "week", "month"]).optional().default("all"),
  topic: z.string().trim().max(64).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["priority", "due", "title", "difficulty"]).optional().default("priority"),
});

export const historyQuerySchema = z.object({
  timezone: timezoneSchema,
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const activityQuerySchema = z.object({
  timezone: timezoneSchema,
  months: z.coerce.number().int().min(1).max(12).optional().default(6),
});

export type LogAutoRevisionBody = z.infer<typeof logAutoRevisionBodySchema>;
