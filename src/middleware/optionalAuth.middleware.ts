import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../config/jwt.js";
import { tokensEqual } from "../utils/sessionToken.js";

/**
 * Attaches `req.user` when a valid Bearer token is present; otherwise continues anonymously.
 * Used by compiler `/run` so guests can try the playground while logged-in users get `userId` linked.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (header === undefined || !header.startsWith("Bearer ")) {
      next();
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    if (token === "") {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, currentAccessToken: true },
    });
    if (user === null || !tokensEqual(token, user.currentAccessToken)) {
      next();
      return;
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    next();
  }
}
