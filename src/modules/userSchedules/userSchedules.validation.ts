import { z } from "zod";

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]);

export const createUserScheduleBodySchema = z.object({
  templateSlug: z.string().trim().min(1, "templateSlug is required"),
  dailyQuestions: z.coerce.number().int().min(1).max(5).optional(),
  difficulty: difficultyEnum.optional(),
});

export type CreateUserScheduleBody = z.infer<typeof createUserScheduleBodySchema>;

export const userScheduleIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid schedule id" }),
});

export type UserScheduleIdParams = z.infer<typeof userScheduleIdParamsSchema>;
