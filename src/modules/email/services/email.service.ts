import { env } from "../../../config/env.js";
import { sendHtmlEmail } from "../providers/resend.provider.js";
import {
  passwordChangedEmailHtml,
  passwordResetOtpEmailHtml,
  verificationOtpEmailHtml,
} from "../templates/otpEmail.js";

export async function sendVerificationOtpEmail(to: string, code: string): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Verify your CodeZero account",
    html: verificationOtpEmailHtml(code, env.OTP_EXPIRY_MINUTES),
  });
}

export async function sendPasswordResetOtpEmail(to: string, code: string): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Reset your CodeZero password",
    html: passwordResetOtpEmailHtml(code, env.OTP_EXPIRY_MINUTES),
  });
}

export async function sendPasswordChangedEmail(to: string): Promise<void> {
  await sendHtmlEmail({
    to,
    subject: "Your CodeZero password was changed",
    html: passwordChangedEmailHtml(),
  });
}
