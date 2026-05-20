/**
 * Auth-specific DTOs shared between service ↔ controller.
 */

export type PublicUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  fullName: string | null;
  country: string | null;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterResult = {
  user: PublicUser;
  requiresVerification: true;
  message: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};

export type VerifyEmailResult = LoginResult;
