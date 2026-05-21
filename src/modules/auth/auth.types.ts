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
  firstTimeLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RegisterResult = {
  user: PublicUser;
  requiresVerification: true;
  message: string;
  resendCooldownSeconds: number;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};

export type OAuthPendingRegistrationResult = {
  status: "pending_registration";
  pendingToken: string;
  email: string;
  suggestedName: string | null;
  avatar: string | null;
  provider: "GOOGLE" | "GITHUB";
};

export type OAuthAuthResult = LoginResult | OAuthPendingRegistrationResult;

export type VerifyEmailResult = LoginResult;
