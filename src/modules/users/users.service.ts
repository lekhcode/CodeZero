import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  isUsernameAvailable,
  isValidUsernameFormat,
  normalizeUsername,
} from "../../utils/username.js";
import { USER_PUBLIC_SELECT, toPublicUser } from "../auth/auth.user.js";
import type { UpdateProfileBody } from "./users.validation.js";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PUBLIC_SELECT,
  });
  if (user === null) {
    throw ApiError.unauthorized("User not found");
  }
  return toPublicUser(user);
}

export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string,
): Promise<{ available: boolean; username: string }> {
  const normalized = normalizeUsername(username);
  if (!isValidUsernameFormat(normalized)) {
    return { available: false, username: normalized };
  }
  const available = await isUsernameAvailable(normalized, excludeUserId);
  return { available, username: normalized };
}

export async function updateUserProfile(userId: string, input: UpdateProfileBody) {
  if (input.username !== undefined) {
    const normalized = normalizeUsername(input.username);
    if (!(await isUsernameAvailable(normalized, userId))) {
      throw ApiError.conflict("Username is already taken");
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.username !== undefined ? { username: normalizeUsername(input.username) } : {}),
        ...(input.fullName !== undefined
          ? {
              fullName: input.fullName,
              ...(input.name === undefined ? { name: input.fullName } : {}),
            }
          : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
      select: USER_PUBLIC_SELECT,
    });
    return toPublicUser(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("Username is already taken");
    }
    throw err;
  }
}
