import type { LoginResult, PublicUser, RegisterResult } from "@/types/api.types";
import { api, unwrap } from "./api";

export const authService = {
  login(email: string, password: string) {
    return unwrap<LoginResult>(api.post("/api/v1/auth/login", { email, password }));
  },

  register(email: string, password: string, username?: string) {
    return unwrap<RegisterResult>(
      api.post("/api/v1/auth/register", { email, password, ...(username ? { username } : {}) }),
    );
  },

  verifyEmail(email: string, code: string) {
    return unwrap<LoginResult>(api.post("/api/v1/auth/verify-email", { email, code }));
  },

  resendOtp(email: string) {
    return unwrap<{ message: string }>(api.post("/api/v1/auth/resend-otp", { email }));
  },

  forgotPassword(email: string) {
    return unwrap<{ message: string }>(api.post("/api/v1/auth/forgot-password", { email }));
  },

  resetPassword(email: string, code: string, password: string) {
    return unwrap<{ message: string }>(
      api.post("/api/v1/auth/reset-password", { email, code, password }),
    );
  },

  requestChangePasswordOtp() {
    return unwrap<{ message: string }>(api.post("/api/v1/auth/change-password/request-otp"));
  },

  confirmChangePassword(code: string, password: string) {
    return unwrap<LoginResult>(api.post("/api/v1/auth/change-password/confirm", { code, password }));
  },

  logout() {
    return unwrap<{ message: string }>(api.post("/api/v1/auth/logout"));
  },

  googleAuth(credential: string) {
    return unwrap<LoginResult>(api.post("/api/v1/auth/google", { credential }));
  },

  githubExchange(code: string) {
    return unwrap<LoginResult>(
      api.get("/api/v1/auth/github/callback", { params: { code, format: "json" } }),
    );
  },

  async me(): Promise<PublicUser> {
    const payload = await unwrap<{ user: PublicUser }>(api.get("/api/v1/users/me"));
    return payload.user;
  },
};
