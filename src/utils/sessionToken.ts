import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time compare for Bearer JWT vs DB `currentAccessToken` (mitigates timing leaks).
 */
export function tokensEqual(bearer: string, stored: string | null): boolean {
  if (stored === null || stored === "") {
    return false;
  }
  const a = Buffer.from(bearer, "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
