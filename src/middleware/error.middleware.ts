import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { HttpError } from "../utils/httpError.js";

function resolveStatus(err: unknown): number {
  if (err instanceof ApiError || err instanceof HttpError) {
    return err.status;
  }

  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 600) {
      return status;
    }
  }

  return 500;
}

function buildClientErrorPayload(err: unknown, status: number): Record<string, unknown> {
  if (err instanceof ApiError) {
    const payload: Record<string, unknown> = {
      success: false as const,
      error: {
        message: err.message,
      },
    };
    const errorObj = payload["error"] as Record<string, unknown>;
    if (err.code !== undefined) {
      errorObj["code"] = err.code;
    }
    if (err.details !== undefined && err.details.length > 0) {
      errorObj["details"] = err.details;
    }
    return payload;
  }

  if (status >= 500) {
    const message =
      err instanceof Error && err.message.trim() !== ""
        ? err.message
        : "Internal Server Error";
    const errorObj: Record<string, unknown> = {
      message,
      code: "INTERNAL_ERROR",
    };
    if (!env.isProduction && err instanceof Error && err.stack !== undefined) {
      errorObj["stack"] = err.stack;
    }
    return {
      success: false as const,
      error: errorObj,
    };
  }

  if (err instanceof HttpError) {
    return {
      success: false as const,
      error: { message: err.message, code: "HTTP_ERROR" },
    };
  }

  if (err instanceof Error) {
    return {
      success: false as const,
      error: { message: err.message, code: "ERROR" },
    };
  }

  return {
    success: false as const,
    error: { message: "Error", code: "ERROR" },
  };
}

/**
 * Central error boundary. Keeps route handlers thin: throw or `next(err)` and format here.
 *
 * Day 2: `ApiError` carries optional `code` + validation `details` for machine-readable clients.
 * Legacy `HttpError` remains supported for older call sites.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("GLOBAL ERROR =>", err);

  const status = resolveStatus(err);
  const body = buildClientErrorPayload(err, status);

  if (status >= 500) {
    logger.error({ err, status }, "unhandled server error");
  }

  res.status(status).json(body);
};
