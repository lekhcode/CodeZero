import { Resend } from "resend";
import { env } from "../../../config/env.js";
import { logger } from "../../../config/logger.js";

let client: Resend | null = null;

function getResend(): Resend {
  if (client === null) {
    if (env.RESEND_API_KEY === "") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export type SendHtmlEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendHtmlEmail(input: SendHtmlEmailInput): Promise<void> {
  if (env.EMAIL_OTP_LOG_CONSOLE) {
    logger.info(
      { to: input.to, subject: input.subject, preview: input.html.slice(0, 200) },
      "email: console mode (not sent via Resend)",
    );
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error !== null && error !== undefined) {
    logger.error({ err: error, to: input.to }, "email: Resend send failed");
    throw new Error(error.message ?? "Failed to send email");
  }
}
