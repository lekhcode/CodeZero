/**
 * Auth-specific DTOs shared between service ↔ controller.
 * Keep these HTTP-shaped types here; persistence types stay with Prisma.
 */

/** User fields safe to return to clients (never includes `password`). */
export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: Date;
};

export type RegisterResult = {
  user: PublicUser;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};
