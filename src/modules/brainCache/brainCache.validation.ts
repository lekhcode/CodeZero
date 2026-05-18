import { z } from "zod";

const isoDateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const playlistIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const playlistProblemParamsSchema = z.object({
  id: z.string().uuid(),
  problemId: z.string().uuid(),
});

export const revisionIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const problemIdParamsSchema = z.object({
  problemId: z.string().uuid(),
});

export const slugParamsSchema = z.object({
  slug: z.string().min(1).max(200),
});

const notificationPrefsSchema = z
  .object({
    notifyEmail: z.boolean().optional(),
    notifyWhatsapp: z.boolean().optional(),
    notifyInApp: z.boolean().optional(),
    notifyPush: z.boolean().optional(),
  })
  .optional();

export const createPlaylistBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  revisionIntervalDays: z.number().int().min(1).max(365).optional(),
  customRevisionDates: z.array(isoDateKey).max(52).optional(),
  notificationPrefs: notificationPrefsSchema,
});

export const updatePlaylistBodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  revisionIntervalDays: z.number().int().min(1).max(365).optional(),
  customRevisionDates: z.array(isoDateKey).max(52).optional(),
  notificationPrefs: notificationPrefsSchema,
});

export const addProblemBodySchema = z.object({
  problemId: z.string().uuid(),
});

export const moveProblemBodySchema = z.object({
  toPlaylistId: z.string().uuid(),
});

export type CreatePlaylistBody = z.infer<typeof createPlaylistBodySchema>;
export type UpdatePlaylistBody = z.infer<typeof updatePlaylistBodySchema>;
export type MoveProblemBody = z.infer<typeof moveProblemBodySchema>;
