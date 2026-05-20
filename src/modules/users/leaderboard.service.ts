import { JudgeMode, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarSeed: string;
  problemsSolved: number;
  acceptedSubmissions: number;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  totalUsers: number;
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
};

const LEADERBOARD_LIMIT = 20;

function displayNameFromUser(user: { email: string; name: string | null }): string {
  const trimmed = user.name?.trim();
  if (trimmed !== undefined && trimmed.length > 0) {
    return trimmed;
  }
  const local = user.email.split("@")[0] ?? "coder";
  return local.length > 0 ? local : "coder";
}

export async function getLeaderboard(currentUserId: string): Promise<LeaderboardResponse> {
  const [users, solveGroups, acceptedGroups] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },
    }),
    prisma.userProblemSolve.groupBy({
      by: ["userId"],
      _count: { problemId: true },
    }),
    prisma.judgeSubmission.groupBy({
      by: ["userId"],
      where: {
        mode: JudgeMode.FULL_JUDGE,
        status: SubmissionStatus.ACCEPTED,
      },
      _count: { id: true },
    }),
  ]);

  const solvedByUser = new Map(solveGroups.map((g) => [g.userId, g._count.problemId]));
  const acceptedByUser = new Map(acceptedGroups.map((g) => [g.userId, g._count.id]));

  const ranked = users
    .map((user) => ({
      user,
      problemsSolved: solvedByUser.get(user.id) ?? 0,
      acceptedSubmissions: acceptedByUser.get(user.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.problemsSolved !== a.problemsSolved) {
        return b.problemsSolved - a.problemsSolved;
      }
      if (b.acceptedSubmissions !== a.acceptedSubmissions) {
        return b.acceptedSubmissions - a.acceptedSubmissions;
      }
      return a.user.createdAt.getTime() - b.user.createdAt.getTime();
    });

  const entries: LeaderboardEntry[] = ranked.slice(0, LEADERBOARD_LIMIT).map((row, index) => ({
    rank: index + 1,
    userId: row.user.id,
    displayName: displayNameFromUser(row.user),
    avatarUrl: row.user.avatar,
    avatarSeed: row.user.id,
    problemsSolved: row.problemsSolved,
    acceptedSubmissions: row.acceptedSubmissions,
    isCurrentUser: row.user.id === currentUserId,
  }));

  const currentIndex = ranked.findIndex((row) => row.user.id === currentUserId);
  const currentUserRank = currentIndex >= 0 ? currentIndex + 1 : null;

  return {
    totalUsers: users.length,
    entries,
    currentUserRank,
  };
}
