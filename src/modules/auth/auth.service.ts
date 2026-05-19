import bcrypt from "bcrypt";
import { AuthProvider, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { signAccessToken } from "../../config/jwt.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import { tokensEqual } from "../../utils/sessionToken.js";
import type { LoginBody, RegisterBody } from "./auth.validation.js";
import type { LoginResult, PublicUser, RegisterResult } from "./auth.types.js";

/** bcrypt cost factor — balance CPU vs brute-force resistance (12 is a sensible default in 2026). */
const BCRYPT_ROUNDS = 12;

function toPublicUser(row: {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.createdAt,
  };
}

/** Issue JWT + persist single-session token (shared by email login and OAuth). */
export async function establishUserSession(user: PublicUser): Promise<LoginResult> {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  await prisma.$transaction(async (tx) => {
    const affected = Number(
      await tx.$executeRaw(
        Prisma.sql`UPDATE "users" SET "currentAccessToken" = ${accessToken} WHERE "id" = ${user.id}`,
      ),
    );
    if (affected !== 1) {
      throw new ApiError(500, `Could not persist session token (rows updated: ${affected})`, {
        code: "SESSION_ROW_UPDATE",
      });
    }
    const row = await tx.user.findUnique({
      where: { id: user.id },
      select: { currentAccessToken: true },
    });
    if (!tokensEqual(accessToken, row?.currentAccessToken ?? null)) {
      throw new ApiError(500, "Could not persist session token", {
        code: "SESSION_PERSIST_FAILED",
      });
    }
    logger.debug(
      { userId: user.id, storedTokenChars: row?.currentAccessToken?.length ?? 0 },
      "session: currentAccessToken persisted",
    );
  });

  return { user, accessToken };
}

export async function registerUser(input: RegisterBody): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const created = await prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        provider: AuthProvider.EMAIL,
        // `currentAccessToken` stays null until first successful login (single session starts then).
      },
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    });
    return { user: toPublicUser(created) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("Email already registered");
    }
    throw err;
  }
}

export async function loginUser(input: LoginBody): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      password: true,
      createdAt: true,
    },
  });

  if (user === null || user.password === null) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordOk = await bcrypt.compare(input.password, user.password);
  if (!passwordOk) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  return establishUserSession(toPublicUser(user));
}
