import type { DifficultyLevel, ScheduleType } from "@prisma/client";

/** Nested template summary on user schedule list/detail responses. */
export type UserScheduleTemplateSummary = {
  id: string;
  name: string;
  slug: string;
  type: ScheduleType;
  allowsDifficulty?: boolean;
  allowsCount?: boolean;
  defaultCount?: number | null;
};

export type UserScheduleDto = {
  id: string;
  userId: string;
  templateId: string;
  active: boolean;
  dailyQuestions: number | null;
  difficulty: DifficultyLevel | null;
  createdAt: Date;
  template: UserScheduleTemplateSummary;
};
