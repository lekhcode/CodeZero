import { Gender } from "@prisma/client";
import { z } from "zod";
import { isValidUsernameFormat, normalizeUsername } from "../../utils/username.js";

const genderSchema = z.nativeEnum(Gender).nullable().optional();

export const checkUsernameQuerySchema = z.object({
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .refine(isValidUsernameFormat, { message: "Invalid username format" }),
});

export const updateProfileBodySchema = z.object({
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .refine(isValidUsernameFormat, {
      message: "Username: 3–24 chars, lowercase letters, numbers, underscores only",
    })
    .optional(),
  fullName: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  gender: genderSchema,
  name: z.string().trim().max(80).optional().nullable(),
  /** Dismiss first-run walkthrough (Skip / Finish only). */
  firstTimeLogin: z.literal(false).optional(),
});

export type CheckUsernameQuery = z.infer<typeof checkUsernameQuerySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
