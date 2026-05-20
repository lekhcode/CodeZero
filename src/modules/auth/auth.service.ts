import bcrypt from "bcrypt";
import { AuthProvider, EmailOtpType, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { signAccessToken } from "../../config/jwt.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import { tokensEqual } from "../../utils/sessionToken.js";
import {
  generateUniqueUsername,
  isUsernameAvailable,
  normalizeUsername,
  usernameBaseFromEmail,
} from "../../utils/username.js";
import type {
  ChangePasswordConfirmBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  ResendOtpBody,
  VerifyEmailBody,
} from "./auth.validation.js";
import type { LoginResult, PublicUser, RegisterResult, VerifyEmailResult } from "./auth.types.js";
import { toPublicUser, USER_PUBLIC_SELECT, type UserPublicRow } from "./auth.user.js";
import {
  sendChangePasswordOtp,
  sendEmailVerificationOtp,
  sendPasswordResetOtpForUser,
  verifyUserOtp,
} from "./otp.service.js";
import { sendPasswordChangedEmail } from "../email/services/email.service.js";

const BCRYPT_ROUNDS = 12;

export async function establishUserSession(user: PublicUser): Promise<LoginResult> {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  await prisma.$transaction(async (tx) => {
    const affected = Number(
      await tx.$executeRaw(
        Prisma.sql`UPDATE "users" SET "currentAccessToken" = ${accessToken} WHERE "id" = ${user.id}`,
      ),
    );
    if (affected !== 1) {
      throw new ApiError(500, `Could not persist session token (rows updated: ${affected})`, {
        code: "SESSION_ROW_UPDATE",
      });
    }
    const row = await tx.user.findUnique({
      where: { id: user.id },
      select: { currentAccessToken: true },
    });
    if (!tokensEqual(accessToken, row?.currentAccessToken ?? null)) {
      throw new ApiError(500, "Could not persist session token", {
        code: "SESSION_PERSIST_FAILED",
      });
    }
    logger.debug(
      { userId: user.id, storedTokenChars: row?.currentAccessToken?.length ?? 0 },
      "session: currentAccessToken persisted",
    );
  });

  return { user, accessToken };
}

function assertEmailVerifiedForLogin(user: UserPublicRow): void {
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Verify your email before signing in", { code: "EMAIL_NOT_VERIFIED" });
  }
}

export async function registerUser(input: RegisterBody): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  let username: string;
  if (input.username !== undefined) {
    const normalized = normalizeUsername(input.username);
    if (!(await isUsernameAvailable(normalized))) {
      throw ApiError.conflict("Username is already taken");
    }
    username = normalized;
  } else {
    username = await generateUniqueUsername(usernameBaseFromEmail(input.email));
  }

  try {
    const created = await prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        provider: AuthProvider.EMAIL,
        username,
        isEmailVerified: false,
      },
      select: USER_PUBLIC_SELECT,
    });

    try {
      await sendEmailVerificationOtp(created.id, created.email);
    } catch (emailErr) {
      await prisma.user.delete({ where: { id: created.id } }).catch(() => undefined);
      logger.error({ err: emailErr, userId: created.id }, "register: verification email failed");
      throw new ApiError(503, "Could not send verification email. Please try again.", {
        code: "EMAIL_SEND_FAILED",
      });
    }

    return {
      user: toPublicUser(created),
      requiresVerification: true,
      message: "Verification code sent to your email",
      resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SEC,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("Email already registered");
    }
    throw err;
  }
}

export async function verifyEmail(input: VerifyEmailBody): Promise<VerifyEmailResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...USER_PUBLIC_SELECT, password: true, provider: true },
  });

  if (user === null || user.provider !== AuthProvider.EMAIL) {
    throw new ApiError(400, "Invalid or expired code", { code: "OTP_INVALID" });
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "This email is already verified. Sign in with your password.", {
      code: "EMAIL_ALREADY_VERIFIED",
    });
  }

  await verifyUserOtp(user.id, EmailOtpType.VERIFY_EMAIL, input.code);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
    select: USER_PUBLIC_SELECT,
  });

  return establishUserSession(toPublicUser(updated));
}

export async function resendVerificationOtp(
  input: ResendOtpBody,
): Promise<{ message: string; resendCooldownSeconds: number }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, isEmailVerified: true, provider: true },
  });

  if (user === null || user.provider !== AuthProvider.EMAIL || user.isEmailVerified) {
    return {
      message: "If an account exists, a new code has been sent",
      resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SEC,
    };
  }

  await sendEmailVerificationOtp(user.id, user.email);
  return {
    message: "If an account exists, a new code has been sent",
    resendCooldownSeconds: env.OTP_RESEND_COOLDOWN_SEC,
  };
}

export async function loginUser(input: LoginBody): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...USER_PUBLIC_SELECT, password: true, provider: true },
  });

  if (user === null || user.password === null) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordOk = await bcrypt.compare(input.password, user.password);
  if (!passwordOk) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  assertEmailVerifiedForLogin(user);
  return establishUserSession(toPublicUser(user));
}

export async function forgotPassword(input: ForgotPasswordBody): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, password: true, provider: true },
  });

  if (user === null || user.password === null) {
    return { message: "If an account exists, a reset code has been sent" };
  }

  await sendPasswordResetOtpForUser(user.id, user.email);
  return { message: "If an account exists, a reset code has been sent" };
}

export async function resetPassword(input: ResetPasswordBody): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, password: true },
  });

  if (user === null || user.password === null) {
    throw new ApiError(400, "Invalid or expired code", { code: "OTP_INVALID" });
  }

  await verifyUserOtp(user.id, EmailOtpType.RESET_PASSWORD, input.code);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash, currentAccessToken: null },
  });

  await sendPasswordChangedEmail(user.email, user.id);
  return { message: "Password updated. Sign in with your new password." };
}

export async function requestChangePasswordOtp(userId: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password: true },
  });

  if (user === null || user.password === null) {
    throw ApiError.badRequest("Password login is not enabled for this account");
  }

  await sendChangePasswordOtp(user.id, user.email);
  if (env.EMAIL_OTP_LOG_CONSOLE) {
    return {
      message:
        "Verification code generated. Check the API server terminal (npm run dev) for the 6-digit OTP — email is not sent in dev mode.",
    };
  }
  return { message: "Verification code sent to your email" };
}

export async function confirmChangePassword(
  userId: string,
  input: ChangePasswordConfirmBody,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PUBLIC_SELECT,
  });

  if (user === null) {
    throw ApiError.unauthorized("User not found");
  }

  await verifyUserOtp(userId, EmailOtpType.CHANGE_PASSWORD, input.code);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
    select: USER_PUBLIC_SELECT,
  });

  await sendPasswordChangedEmail(updated.email, updated.id);
  return establishUserSession(toPublicUser(updated));
}

export async function logoutUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { currentAccessToken: null },
  });
}
