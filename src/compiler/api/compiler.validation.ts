import { z } from "zod";

const languageEnum = z.enum(["javascript", "python", "cpp", "java"]);

export const runSubmissionBodySchema = z.object({
  language: languageEnum,
  code: z.string().min(1, "code is required"),
  stdin: z.string().optional(),
});

export type RunSubmissionBody = z.infer<typeof runSubmissionBodySchema>;

export const submissionIdParamsSchema = z.object({
  id: z.uuid("Invalid submission id"),
});
