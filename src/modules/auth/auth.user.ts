import type { Gender } from "@prisma/client";
import type { PublicUser } from "./auth.types.js";

export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  username: true,
  name: true,
  fullName: true,
  country: true,
  gender: true,
  avatar: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type UserPublicRow = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  fullName: string | null;
  country: string | null;
  gender: Gender | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicUser(row: UserPublicRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    fullName: row.fullName,
    country: row.country,
    gender: row.gender,
    avatar: row.avatar,
    isEmailVerified: row.isEmailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
