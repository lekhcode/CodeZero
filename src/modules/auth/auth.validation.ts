import { z } from "zod";
import { validatePassword } from "../../utils/passwordPolicy.js";
import { isValidUsernameFormat, normalizeUsername } from "../../utils/username.js";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" });

const passwordSchema = z.string().superRefine((val, ctx) => {
  const result = validatePassword(val);
  if (!result.valid) {
    for (const msg of result.errors) {
      ctx.addIssue({ code: "custom", message: msg });
    }
  }
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Enter the 6-digit code" });

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .refine(isValidUsernameFormat, {
      message: "Username: 3–24 chars, lowercase letters, numbers, underscores only",
    })
    .optional(),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export const verifyEmailBodySchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const resendOtpBodySchema = z.object({
  email: emailSchema,
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  password: passwordSchema,
});

export const changePasswordRequestBodySchema = z.object({});

export const changePasswordConfirmBodySchema = z.object({
  code: otpCodeSchema,
  password: passwordSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
export type ResendOtpBody = z.infer<typeof resendOtpBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordConfirmBody = z.infer<typeof changePasswordConfirmBodySchema>;

export const googleAuthBodySchema = z.object({
  credential: z.string().min(1, { message: "Google credential is required" }),
});

export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;
