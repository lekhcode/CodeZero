import { EmailOtpType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateOtpCode, hashOtp, otpExpiresAt, verifyOtp } from "../../utils/otp.js";
import {
  sendPasswordResetOtpEmail,
  sendVerificationOtpEmail,
  type OtpEmailDeliveryContext,
} from "../email/services/email.service.js";

async function assertResendCooldown(userId: string, type: EmailOtpType): Promise<void> {
  const latest = await prisma.emailOtp.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest === null) return;

  const elapsedSec = (Date.now() - latest.createdAt.getTime()) / 1000;
  if (elapsedSec < env.OTP_RESEND_COOLDOWN_SEC) {
    const wait = Math.ceil(env.OTP_RESEND_COOLDOWN_SEC - elapsedSec);
    throw new ApiError(429, `Please wait ${wait}s before requesting another code`, {
      code: "OTP_RESEND_COOLDOWN",
    });
  }
}

async function assertHourlyOtpRateLimit(userId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.emailOtp.count({
    where: { userId, createdAt: { gte: since } },
  });
  if (count >= env.OTP_RATE_LIMIT_PER_HOUR) {
    throw new ApiError(429, "Too many verification codes requested. Try again later.", {
      code: "OTP_RATE_LIMIT",
    });
  }
}

async function invalidatePreviousOtps(userId: string, type: EmailOtpType): Promise<void> {
  await prisma.emailOtp.deleteMany({
    where: { userId, type, expiresAt: { gt: new Date() } },
  });
}

type OtpSendFn = (to: string, code: string, ctx: OtpEmailDeliveryContext) => Promise<void>;

async function createAndDeliverOtp(
  userId: string,
  email: string,
  type: EmailOtpType,
  send: OtpSendFn,
): Promise<void> {
  await assertResendCooldown(userId, type);
  await assertHourlyOtpRateLimit(userId);
  await invalidatePreviousOtps(userId, type);

  const code = generateOtpCode();
  const otpHash = await hashOtp(code);

  const record = await prisma.emailOtp.create({
    data: {
      userId,
      otpHash,
      type,
      expiresAt: otpExpiresAt(env.OTP_EXPIRY_MINUTES),
    },
    select: { id: true },
  });

  if (env.EMAIL_OTP_LOG_CONSOLE) {
    logger.info({ userId, type, otp: code, otpId: record.id }, "OTP (dev console)");
  }

  const ctx: OtpEmailDeliveryContext = { userId, otpId: record.id, type };

  try {
    await send(email, code, ctx);
  } catch (err) {
    logger.error({ err, userId, type, otpId: record.id }, "otp: email delivery failed");
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(503, "Could not send email. Please try again shortly.", {
      code: "EMAIL_SEND_FAILED",
    });
  }
}

export async function sendEmailVerificationOtp(userId: string, email: string): Promise<void> {
  await createAndDeliverOtp(userId, email, EmailOtpType.VERIFY_EMAIL, sendVerificationOtpEmail);
}

export async function sendPasswordResetOtpForUser(userId: string, email: string): Promise<void> {
  await createAndDeliverOtp(userId, email, EmailOtpType.RESET_PASSWORD, sendPasswordResetOtpEmail);
}

export async function sendChangePasswordOtp(userId: string, email: string): Promise<void> {
  await createAndDeliverOtp(userId, email, EmailOtpType.CHANGE_PASSWORD, sendPasswordResetOtpEmail);
}

export async function verifyUserOtp(
  userId: string,
  type: EmailOtpType,
  code: string,
): Promise<void> {
  const record = await prisma.emailOtp.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
  });

  if (record === null) {
    throw new ApiError(400, "Invalid or expired code", { code: "OTP_INVALID" });
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { id: record.id } });
    throw new ApiError(400, "Code has expired", { code: "OTP_EXPIRED" });
  }

  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many failed attempts. Request a new code.", {
      code: "OTP_MAX_ATTEMPTS",
    });
  }

  const ok = await verifyOtp(code, record.otpHash);
  if (!ok) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(400, "Invalid or expired code", { code: "OTP_INVALID" });
  }

  await prisma.emailOtp.delete({ where: { id: record.id } });
}
