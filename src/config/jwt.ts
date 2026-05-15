import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * JWT access tokens (Day 2): stateless auth suitable for horizontal scaling.
 * No refresh tokens yet — shortening `JWT_EXPIRES_IN` is the main mitigation until rotation exists.
 */

export type AccessTokenPayload = {
  /** Subject: user id (UUID) */
  sub: string;
  email: string;
};

export function signAccessToken(params: { userId: string; email: string }): string {
  const secret: Secret = env.JWT_SECRET;
  return jwt.sign({ sub: params.userId, email: params.email }, secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const secret: Secret = env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new ApiError(401, "Invalid token", { code: "INVALID_TOKEN" });
    }
    const record = decoded as jwt.JwtPayload & { email?: unknown };
    const sub = record.sub;
    const email = record.email;
    if (typeof sub !== "string" || typeof email !== "string") {
      throw new ApiError(401, "Invalid token", { code: "INVALID_TOKEN" });
    }
    return { sub, email };
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(401, "Invalid or expired token", { code: "INVALID_TOKEN" });
  }
}
