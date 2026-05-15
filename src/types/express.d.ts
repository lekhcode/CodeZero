/**
 * Express request augmentation for authenticated routes.
 *
 * `requireAuth` attaches a minimal user DTO (no password) so downstream handlers stay dumb and safe.
 * If you later add roles/permissions, extend this type — not the full Prisma `User` row.
 */
export type AuthedUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export {};
