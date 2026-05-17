import { z } from "zod";

export const judgeCodeBodySchema = z.object({
  language: z.enum(["javascript", "python", "cpp", "java"]),
  code: z.string().min(1),
});

/** Submit only — coding time tracked in browser until Submit (max 12h ms). */
export const judgeSubmitCodeBodySchema = judgeCodeBodySchema.extend({
  codingDurationMs: z.number().int().min(0).max(1000 * 60 * 60 * 12).optional(),
});

export const problemUuidParamsSchema = z.object({
  problemId: z.uuid(),
});

export const judgeSubmissionIdParamsSchema = z.object({
  id: z.uuid(),
});

export const adminTemplateBodySchema = z.object({
  language: z.enum(["javascript", "python", "cpp", "java"]),
  starterCode: z.string().min(1),
  functionName: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, "Invalid function name"),
  judgeArgHints: z.string().optional().nullable(),
});

const adminTestcaseItemSchema = z.object({
  input: z.string().min(1),
  expectedOutput: z.string().min(1),
  isHidden: z.boolean(),
  orderIndex: z.number().int().min(0),
});

/** Single testcase object or a non-empty array of testcases. */
export const adminTestcaseBodySchema = z.union([
  adminTestcaseItemSchema.transform((item) => ({
    mode: "single" as const,
    items: [item],
  })),
  z
    .array(adminTestcaseItemSchema)
    .min(1)
    .transform((items) => ({
      mode: "batch" as const,
      items,
    })),
]);
