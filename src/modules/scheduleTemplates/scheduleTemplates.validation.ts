import { z } from "zod";

/**
 * GET /schedule-templates has no query/body validation yet.
 * Add pagination (`page`, `pageSize`) or `type` filters here when the catalog grows.
 */
export type ScheduleTemplatesListQuery = Record<string, never>;

export const templateSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export type TemplateSlugParams = z.infer<typeof templateSlugParamsSchema>;
