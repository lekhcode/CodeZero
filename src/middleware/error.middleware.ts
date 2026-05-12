import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger.js";
import { HttpError } from "../utils/httpError.js";

function resolveStatus(err: unknown): number {
  if (err instanceof HttpError) {
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

function resolveClientMessage(err: unknown, status: number): string {
  if (status >= 500) {
    return "Internal Server Error";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Error";
}

/**
 * Central error boundary. Keeps route handlers thin: throw or `next(err)` and format here.
 * Later: map Prisma error codes to HTTP status, add requestId, structured logs, etc.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = resolveStatus(err);
  const message = resolveClientMessage(err, status);

  if (status >= 500) {
    logger.error({ err, status }, "unhandled server error");
  }

  res.status(status).json({ error: message });
};
