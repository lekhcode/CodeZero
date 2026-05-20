import type { NextFunction, Request, Response } from "express";
import { AuthProvider } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../config/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { tokensEqual } from "../utils/sessionToken.js";

/**
 * Requires `Authorization: Bearer <jwt>`.
 *
 * Verifies signature + expiry, loads the user from the DB (so deleted users lose access immediately),
 * then enforces single-session: the raw JWT must exactly match `User.currentAccessToken` (set on last login).
 * If the client sends a different token than the one stored (e.g. old session after a new login), respond 401.
 * Attaches `req.user` for controllers.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (header === undefined || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    if (token === "") {
      throw ApiError.unauthorized("Missing or invalid Authorization header");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        currentAccessToken: true,
        isEmailVerified: true,
        provider: true,
      },
    });
    if (user === null) {
      throw ApiError.unauthorized("User not found");
    }

    if (!tokensEqual(token, user.currentAccessToken)) {
      throw ApiError.unauthorized("Unauthorized");
    }

    if (user.provider === AuthProvider.EMAIL && !user.isEmailVerified) {
      throw new ApiError(403, "Verify your email before using the app", {
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}
