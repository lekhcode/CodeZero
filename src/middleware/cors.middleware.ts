import cors from "cors";
import type { CorsOptions } from "cors";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Browser CORS for local Vite (:5173–:5175 / :127.0.0.1) and production frontends.
 * Prefer empty `VITE_API_BASE_URL` in dev so Vite proxies `/api` (no CORS needed).
 */
export function createCorsMiddleware(): ReturnType<typeof cors> {
  const allowlist = env.CORS_ALLOWLIST;

  const options: CorsOptions = {
    origin(origin, callback) {
      // Same-origin, Postman, curl — no Origin header
      if (origin === undefined) {
        callback(null, true);
        return;
      }

      if (allowlist.length === 0) {
        callback(null, !env.isProduction);
        return;
      }

      if (allowlist.includes(origin)) {
        callback(null, true);
        return;
      }

      logger.warn({ origin, allowlist }, "cors: blocked origin");
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-email-test-secret"],
  };

  return cors(options);
}
