import crypto from "node:crypto";
import bcrypt from "bcrypt";

const OTP_BCRYPT_ROUNDS = 10;

export function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
}

export async function verifyOtp(code: string, otpHash: string): Promise<boolean> {
  return bcrypt.compare(code, otpHash);
}

export function otpExpiresAt(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
