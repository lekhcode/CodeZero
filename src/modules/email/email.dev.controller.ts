import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { verificationOtpEmailHtml } from "./templates/otpEmail.js";
import {
  isResendSandboxFrom,
  RESEND_TEST_RECIPIENTS,
  sendHtmlEmail,
} from "./providers/resend.provider.js";

type TestEmailBody = {
  to: string;
  template?: "verification" | "plain";
  subject?: string;
};

export async function sendTestEmail(req: Request, res: Response): Promise<void> {
  if (env.EMAIL_TEST_SECRET === "") {
    throw new ApiError(
      503,
      "EMAIL_TEST_SECRET is not set in server .env. Add it and restart the API.",
      { code: "EMAIL_TEST_NOT_CONFIGURED" },
    );
  }

  const secret = req.header("x-email-test-secret");
  if (secret !== env.EMAIL_TEST_SECRET) {
    throw ApiError.unauthorized("Invalid or missing x-email-test-secret header");
  }

  const body = req.body as TestEmailBody;
  const template = body.template ?? "verification";
  const testCode = "123456";
  const sandbox = isResendSandboxFrom();

  let result: { id: string };

  if (template === "plain") {
    result = await sendHtmlEmail({
      to: body.to,
      subject: body.subject ?? "CodeZero test email",
      html: `<p>This is a test message from CodeZero.</p><p>Time: ${new Date().toISOString()}</p>`,
      idempotencyKey: `dev-test/plain/${body.to}/${Date.now()}`,
      tags: [{ name: "type", value: "dev_test" }],
    });
  } else {
    result = await sendHtmlEmail({
      to: body.to,
      subject: "Verify your CodeZero account",
      html: verificationOtpEmailHtml(testCode, env.OTP_EXPIRY_MINUTES),
      idempotencyKey: `dev-test/verify/${body.to}/${Date.now()}`,
      tags: [{ name: "type", value: "dev_test_verify" }],
    });
  }

  ApiResponse.success(res, {
    message: "Test email sent via Resend",
    resendEmailId: result.id,
    to: body.to,
    template,
    consoleMode: env.EMAIL_OTP_LOG_CONSOLE,
    from: env.EMAIL_FROM,
    sandboxFrom: sandbox,
    sampleOtp: template === "verification" ? testCode : undefined,
    resendTestAddresses: sandbox ? RESEND_TEST_RECIPIENTS : undefined,
    hint: sandbox
      ? `Sandbox from: use to=${RESEND_TEST_RECIPIENTS.delivered} or your Resend account email, or set EMAIL_FROM to your verified domain.`
      : "Production sender — any recipient allowed on verified domain.",
  });
}
