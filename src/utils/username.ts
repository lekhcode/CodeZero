import { prisma } from "../config/prisma.js";

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameFormat(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function usernameBaseFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  let base = local
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (base.length < 3) base = `user_${base}`;
  return base.slice(0, 20);
}

export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existing === null) return true;
  if (excludeUserId !== undefined && existing.id === excludeUserId) return true;
  return false;
}

export async function generateUniqueUsername(baseInput: string): Promise<string> {
  const base = normalizeUsername(baseInput);
  const safeBase = isValidUsernameFormat(base) ? base : usernameBaseFromEmail(`${base}@x.dev`);

  if (await isUsernameAvailable(safeBase)) return safeBase;

  for (let i = 0; i < 50; i += 1) {
    const suffix = String(Math.floor(Math.random() * 9000) + 1000);
    const candidate = `${safeBase.slice(0, 16)}_${suffix}`.slice(0, 24);
    if (isValidUsernameFormat(candidate) && (await isUsernameAvailable(candidate))) {
      return candidate;
    }
  }

  const fallback = `user_${Date.now().toString(36).slice(-8)}`;
  return fallback.slice(0, 24);
}
