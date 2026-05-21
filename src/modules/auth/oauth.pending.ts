import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { AuthProvider } from "@prisma/client";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

export type OAuthPendingClaims = {
  email: string;
  provider: AuthProvider;
  googleId: string | null;
  githubId: string | null;
  name: string | null;
  avatar: string | null;
};

const PURPOSE = "oauth_pending";

export function signOAuthPendingToken(claims: OAuthPendingClaims): string {
  const secret: Secret = env.JWT_SECRET;
  return jwt.sign({ purpose: PURPOSE, ...claims }, secret, {
    expiresIn: "30m",
  } as SignOptions);
}

export function verifyOAuthPendingToken(token: string): OAuthPendingClaims {
  try {
    const secret: Secret = env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new ApiError(401, "Invalid registration session", { code: "OAUTH_PENDING_INVALID" });
    }
    const record = decoded as jwt.JwtPayload & {
      purpose?: unknown;
      email?: unknown;
      provider?: unknown;
      googleId?: unknown;
      githubId?: unknown;
      name?: unknown;
      avatar?: unknown;
    };
    if (record.purpose !== PURPOSE) {
      throw new ApiError(401, "Invalid registration session", { code: "OAUTH_PENDING_INVALID" });
    }
    if (typeof record.email !== "string" || typeof record.provider !== "string") {
      throw new ApiError(401, "Invalid registration session", { code: "OAUTH_PENDING_INVALID" });
    }
    return {
      email: record.email.trim().toLowerCase(),
      provider: record.provider as AuthProvider,
      googleId: typeof record.googleId === "string" ? record.googleId : null,
      githubId: typeof record.githubId === "string" ? record.githubId : null,
      name: typeof record.name === "string" ? record.name : null,
      avatar: typeof record.avatar === "string" ? record.avatar : null,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Registration session expired. Start again from Create account.", {
      code: "OAUTH_PENDING_EXPIRED",
    });
  }
}
