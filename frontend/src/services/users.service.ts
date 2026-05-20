import type { PublicUser } from "@/types/api.types";
import { api, unwrap } from "./api";

export const usersService = {
  checkUsername(username: string) {
    return unwrap<{ available: boolean; username: string }>(
      api.get("/api/v1/users/check-username", { params: { username } }),
    );
  },

  updateProfile(body: {
    username?: string;
    fullName?: string | null;
    country?: string | null;
    gender?: PublicUser["gender"];
    name?: string | null;
  }) {
    return unwrap<{ user: PublicUser }>(api.patch("/api/v1/users/me", body));
  },
};
