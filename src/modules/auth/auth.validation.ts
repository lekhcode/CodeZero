import { z } from "zod";

/**
 * Zod schemas for auth endpoints — single source of truth for runtime validation + inferred TS types.
 */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" });

export const registerBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

export const googleAuthBodySchema = z.object({
  credential: z.string().min(1, { message: "Google credential is required" }),
});

export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;
