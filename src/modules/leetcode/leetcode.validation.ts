import { z } from "zod";

/** LeetCode title slugs: lowercase letters, digits, hyphens (e.g. `two-sum`). */
export const problemSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid problem slug"),
});

export type ProblemSlugParams = z.infer<typeof problemSlugParamsSchema>;
