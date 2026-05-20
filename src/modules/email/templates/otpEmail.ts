import { baseEmailTemplate } from "./baseTemplate.js";

function otpBlock(code: string): string {
  return `<div style="margin:20px 0;padding:16px 20px;background:#241c16;border:1px solid rgba(217,153,11,0.35);border-radius:8px;text-align:center;">
    <div style="font-family:'Fira Code',monospace;font-size:28px;font-weight:700;letter-spacing:0.35em;color:#d9990b;">${code}</div>
  </div>`;
}

export function verificationOtpEmailHtml(code: string, expiryMinutes: number): string {
  return baseEmailTemplate(
    "Verify your CodeZero email",
    `<h1 style="margin:0 0 12px;font-size:20px;color:#f0ebe4;">Verify your email</h1>
    <p style="margin:0 0 16px;color:#a99b76;">Enter this code in CodeZero to activate your account.</p>
    ${otpBlock(code)}
    <p style="margin:0;color:#a99b76;font-size:13px;">Expires in <strong style="color:#f0ebe4;">${expiryMinutes} minutes</strong>.</p>
    <p style="margin:16px 0 0;font-size:12px;color:#8a7a66;">Security: CodeZero will never ask for this code over chat or phone.</p>`,
  );
}

export function passwordResetOtpEmailHtml(code: string, expiryMinutes: number): string {
  return baseEmailTemplate(
    "Reset your CodeZero password",
    `<h1 style="margin:0 0 12px;font-size:20px;color:#f0ebe4;">Password reset</h1>
    <p style="margin:0 0 16px;color:#a99b76;">Use this code to reset your password.</p>
    ${otpBlock(code)}
    <p style="margin:0;color:#a99b76;font-size:13px;">Expires in <strong style="color:#f0ebe4;">${expiryMinutes} minutes</strong>.</p>`,
  );
}

export function passwordChangedEmailHtml(): string {
  return baseEmailTemplate(
    "Your CodeZero password was changed",
    `<h1 style="margin:0 0 12px;font-size:20px;color:#f0ebe4;">Password updated</h1>
    <p style="margin:0 0 12px;color:#a99b76;">Your account password was changed successfully.</p>
    <p style="margin:0;font-size:13px;color:#8a7a66;">If you did not make this change, reset your password immediately and review active sessions.</p>`,
  );
}
