import type { LoginResult, PublicUser, RegisterResult } from "@/types/api.types";
import { api, unwrap } from "./api";

export const authService = {
  login(email: string, password: string) {
    return unwrap<LoginResult>(api.post("/api/v1/auth/login", { email, password }));
  },

  register(email: string, password: string) {
    return unwrap<RegisterResult>(api.post("/api/v1/auth/register", { email, password }));
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
