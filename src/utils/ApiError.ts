import type { ZodError } from "zod";

/**
 * Structured client error for HTTP APIs.
 *
 * Why not plain `Error`: we need a stable `status` + optional machine-readable `code`
 * and validation `details` without every controller manually calling `res.status().json(...)`.
 *
 * Thrown errors bubble to `error.middleware.ts`, which maps them to JSON responses.
 */
export type ApiErrorDetail = {
  path: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    status: number,
    message: string,
    options?: { cause?: unknown; code?: string; details?: ApiErrorDetail[] },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ApiError";
    this.status = status;
    if (options?.code !== undefined) {
      this.code = options.code;
    }
    if (options?.details !== undefined) {
      this.details = options.details;
    }
  }

  /** Map Zod issues to a single 422 response (unprocessable entity / validation). */
  static fromZod(error: ZodError): ApiError {
    const details: ApiErrorDetail[] = error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
      message: issue.message,
    }));
    return new ApiError(422, "Validation failed", {
      code: "VALIDATION_ERROR",
      details,
    });
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message, { code: "BAD_REQUEST" });
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Not Found"): ApiError {
    return new ApiError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, { code: "CONFLICT" });
  }

  static tooManyRequests(message: string): ApiError {
    return new ApiError(429, message, { code: "RATE_LIMITED" });
  }

  /** Redis down, BullMQ unreachable, or other dependency outage. */
  static serviceUnavailable(message: string): ApiError {
    return new ApiError(503, message, { code: "SERVICE_UNAVAILABLE" });
  }
}
