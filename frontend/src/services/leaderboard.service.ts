import type { LeaderboardResponse } from "@/types/api.types";
import { api, unwrap } from "./api";

export const leaderboardService = {
  getLeaderboard() {
    return unwrap<LeaderboardResponse>(api.get("/api/v1/users/leaderboard"));
  },
};
