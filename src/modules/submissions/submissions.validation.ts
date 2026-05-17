import { SubmissionStatus } from "@prisma/client";
import { z } from "zod";

const verdictValues = Object.values(SubmissionStatus) as [SubmissionStatus, ...SubmissionStatus[]];

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  verdict: z.enum(verdictValues).optional(),
  language: z.string().trim().min(1).optional(),
  problemSlug: z.string().trim().min(1).optional(),
});

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;

export const submissionIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid submission id" }),
});

export type SubmissionIdParams = z.infer<typeof submissionIdParamsSchema>;

export const activityQuerySchema = z.object({
  year: z.coerce.number().int().min(2015).max(2100).optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
