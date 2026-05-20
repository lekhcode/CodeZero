import { Resend } from "resend";
import { env } from "../../../config/env.js";
import { logger } from "../../../config/logger.js";
import { ApiError } from "../../../utils/ApiError.js";

/** Resend test inboxes — safe for integration tests (see resend.com/docs). */
export const RESEND_TEST_RECIPIENTS = {
  delivered: "delivered@resend.dev",
  bounced: "bounced@resend.dev",
  complained: "complained@resend.dev",
  suppressed: "suppressed@resend.dev",
} as const;

type ResendSendError = {
  message?: string;
  statusCode?: number;
  name?: string;
};

export function isResendSandboxFrom(from: string = env.EMAIL_FROM): boolean {
  return /onboarding@resend\.dev/i.test(from);
}

function mapResendError(error: ResendSendError, to: string | string[]): ApiError {
  const msg = error.message ?? "Failed to send email";
  const toLabel = Array.isArray(to) ? to.join(", ") : to;

  if (msg.includes("only send testing emails to your own email address")) {
    const ownerMatch = /\(([^)]+)\)/.exec(msg);
    const ownerEmail = ownerMatch?.[1] ?? "your Resend account email";
    return new ApiError(
      403,
      `Resend sandbox (${env.EMAIL_FROM}): send to ${ownerEmail}, a test address (${RESEND_TEST_RECIPIENTS.delivered}), or set EMAIL_FROM to your verified domain.`,
      {
        code: "RESEND_SANDBOX_RECIPIENT",
        details: [
          { path: "to", message: `Requested: ${toLabel}. Sandbox allows: ${ownerEmail}` },
          { path: "from", message: env.EMAIL_FROM },
        ],
      },
    );
  }

  if (msg.includes("verify a domain") || msg.includes("verified domain")) {
    return new ApiError(403, msg, {
      code: "RESEND_DOMAIN_REQUIRED",
      details: [
        {
          path: "from",
          message: "Set EMAIL_FROM to an address on your verified domain (not onboarding@resend.dev)",
        },
      ],
    });
  }

  if (error.statusCode === 429 || error.name === "rate_limit_exceeded") {
    return new ApiError(429, "Resend rate limit exceeded. Retry in a moment.", {
      code: "RESEND_RATE_LIMIT",
    });
  }

  const status =
    typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 502;

  logger.error({ err: error, to: toLabel, from: env.EMAIL_FROM, status }, "email: Resend send failed");
  return new ApiError(status, msg, { code: "EMAIL_SEND_FAILED" });
}

let client: Resend | null = null;

function getResend(): Resend {
  if (client === null) {
    if (env.RESEND_API_KEY === "") {
      throw new ApiError(503, "RESEND_API_KEY is not configured", { code: "RESEND_NOT_CONFIGURED" });
    }
    client = new Resend(env.RESEND_API_KEY);
    if (env.isProduction && isResendSandboxFrom()) {
      logger.warn(
        { from: env.EMAIL_FROM },
        "email: production is using onboarding@resend.dev — set EMAIL_FROM to your verified domain",
      );
    }
  }
  return client;
}

export type SendHtmlEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  /** Resend idempotency key — unique per send; safe retries within 24h */
  idempotencyKey?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendHtmlEmailResult = {
  id: string;
};

/**
 * Sends HTML email via Resend SDK (`{ data, error }` pattern — errors are not thrown by the SDK).
 */
export async function sendHtmlEmail(input: SendHtmlEmailInput): Promise<SendHtmlEmailResult> {
  if (env.EMAIL_OTP_LOG_CONSOLE) {
    logger.info(
      {
        to: input.to,
        subject: input.subject,
        idempotencyKey: input.idempotencyKey,
        preview: input.html.slice(0, 200),
      },
      "email: console mode (not sent via Resend)",
    );
    return { id: "console-mode" };
  }

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
    ...(input.tags !== undefined && input.tags.length > 0 ? { tags: input.tags } : {}),
  });

  if (error !== null && error !== undefined) {
    throw mapResendError(error as ResendSendError, input.to);
  }

  const id = data?.id ?? "unknown";
  logger.debug({ id, to: input.to, subject: input.subject }, "email: sent via Resend");
  return { id };
}
