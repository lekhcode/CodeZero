import type { ScheduleType } from "@prisma/client";

/**
 * Public shape for catalog rows returned by GET /schedule-templates.
 * Keeps HTTP DTOs separate from Prisma models so we can add fields later without leaking internals.
 */
export type ScheduleTemplateDto = {
  id: string;
  name: string;
  slug: string;
  type: ScheduleType;
  isSystem: boolean;
  allowsDifficulty: boolean;
  allowsCount: boolean;
  defaultCount: number | null;
  createdAt: Date;
};
