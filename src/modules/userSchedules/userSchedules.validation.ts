import { z } from "zod";

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]);
const difficultyLevelEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

export const createUserScheduleBodySchema = z.object({
  templateSlug: z.string().trim().min(1, "templateSlug is required"),
  dailyQuestions: z.coerce.number().int().min(1).max(6).optional(),
  /** Legacy single value — still accepted */
  difficulty: difficultyEnum.optional(),
  /** Preferred: one or more of EASY / MEDIUM / HARD (all three = mixed) */
  difficulties: z.array(difficultyLevelEnum).min(1).max(3).optional(),
});

export type CreateUserScheduleBody = z.infer<typeof createUserScheduleBodySchema>;

export const userScheduleIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid schedule id" }),
});

export type UserScheduleIdParams = z.infer<typeof userScheduleIdParamsSchema>;
