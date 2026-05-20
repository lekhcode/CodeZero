import { EmailOtpType } from "@prisma/client";
import { env } from "../../../config/env.js";
import { sendHtmlEmail } from "../providers/resend.provider.js";
import {
  passwordChangedEmailHtml,
  passwordResetOtpEmailHtml,
  verificationOtpEmailHtml,
} from "../templates/otpEmail.js";

export type OtpEmailDeliveryContext = {
  userId: string;
  otpId: string;
  type: EmailOtpType;
};

function otpIdempotencyKey(ctx: OtpEmailDeliveryContext): string {
  const slug =
    ctx.type === EmailOtpType.VERIFY_EMAIL
      ? "verify-email"
      : ctx.type === EmailOtpType.RESET_PASSWORD
        ? "reset-password"
        : "change-password";
  return `${slug}/${ctx.userId}/${ctx.otpId}`;
}

function otpTags(ctx: OtpEmailDeliveryContext): Array<{ name: string; value: string }> {
  return [
    { name: "type", value: ctx.type.toLowerCase() },
    { name: "user_id", value: ctx.userId },
  ];
}

export async function sendVerificationOtpEmail(
  to: string,
  code: string,
  ctx: OtpEmailDeliveryContext,
): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Verify your CodeZero account",
    html: verificationOtpEmailHtml(code, env.OTP_EXPIRY_MINUTES),
    idempotencyKey: otpIdempotencyKey(ctx),
    tags: otpTags(ctx),
  });
}

export async function sendPasswordResetOtpEmail(
  to: string,
  code: string,
  ctx: OtpEmailDeliveryContext,
): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Reset your CodeZero password",
    html: passwordResetOtpEmailHtml(code, env.OTP_EXPIRY_MINUTES),
    idempotencyKey: otpIdempotencyKey(ctx),
    tags: otpTags(ctx),
  });
}

export async function sendPasswordChangedEmail(to: string, userId: string): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Your CodeZero password was changed",
    html: passwordChangedEmailHtml(),
    idempotencyKey: `password-changed/${userId}/${Date.now()}`,
    tags: [{ name: "type", value: "password_changed" }, { name: "user_id", value: userId }],
  });
}
