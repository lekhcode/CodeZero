import { JudgeMode, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { localDateKey } from "../submissions/submissionActivity.service.js";

export type DailyLearningPoint = {
  date: string;
  /** New unique problems solved that day */
  solvedCount: number;
  /** Accepted full-judge submissions that day */
  acceptedCount: number;
};

export type LearningInsights = {
  rangeDays: number;
  dailyPoints: DailyLearningPoint[];
  trend: "up" | "down" | "stable";
  consistencyPercent: number;
  totalSolvedInRange: number;
  totalAcceptedInRange: number;
  comparisonLabel: string;
};

const RANGE_DAYS = 30;
const CONSISTENCY_WINDOW = 14;

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addLocalDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getLearningInsightsForUser(userId: string): Promise<LearningInsights> {
  const today = startOfLocalDay(new Date());
  const rangeStart = addLocalDays(today, -(RANGE_DAYS - 1));
  const queryEnd = new Date(today);
  queryEnd.setHours(23, 59, 59, 999);

  const [solves, acceptedRows] = await Promise.all([
    prisma.userProblemSolve.findMany({
      where: { userId, solvedAt: { gte: rangeStart, lte: queryEnd } },
      select: { solvedAt: true },
    }),
    prisma.judgeSubmission.findMany({
      where: {
        userId,
        mode: JudgeMode.FULL_JUDGE,
        status: SubmissionStatus.ACCEPTED,
        createdAt: { gte: rangeStart, lte: queryEnd },
      },
      select: { createdAt: true },
    }),
  ]);

  const solvedByDate = new Map<string, number>();
  for (const row of solves) {
    const key = localDateKey(row.solvedAt);
    solvedByDate.set(key, (solvedByDate.get(key) ?? 0) + 1);
  }

  const acceptedByDate = new Map<string, number>();
  for (const row of acceptedRows) {
    const key = localDateKey(row.createdAt);
    acceptedByDate.set(key, (acceptedByDate.get(key) ?? 0) + 1);
  }

  const dailyPoints: DailyLearningPoint[] = [];
  const cursor = new Date(rangeStart);
  while (cursor.getTime() <= today.getTime()) {
    const key = localDateKey(cursor);
    dailyPoints.push({
      date: key,
      solvedCount: solvedByDate.get(key) ?? 0,
      acceptedCount: acceptedByDate.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const chartValues = dailyPoints.map((d) =>
    d.solvedCount > 0 ? d.solvedCount : d.acceptedCount,
  );
  const firstHalf = chartValues.slice(0, Math.floor(chartValues.length / 2));
  const secondHalf = chartValues.slice(Math.floor(chartValues.length / 2));
  const sum = (arr: number[]) => arr.reduce((n, v) => n + v, 0);
  const firstSum = sum(firstHalf);
  const secondSum = sum(secondHalf);

  let trend: LearningInsights["trend"] = "stable";
  if (secondSum > firstSum * 1.15 && secondSum > 0) trend = "up";
  else if (secondSum < firstSum * 0.85 && firstSum > 0) trend = "down";

  const consistencyWindow = dailyPoints.slice(-CONSISTENCY_WINDOW);
  const activeDays = consistencyWindow.filter(
    (d) => d.solvedCount > 0 || d.acceptedCount > 0,
  ).length;
  const consistencyPercent = Math.round((activeDays / CONSISTENCY_WINDOW) * 100);

  const comparisonLabel =
    trend === "up"
      ? "Activity is rising vs the prior two weeks"
      : trend === "down"
        ? "Activity dipped vs the prior two weeks"
        : "Steady rhythm over the last month";

  return {
    rangeDays: RANGE_DAYS,
    dailyPoints,
    trend,
    consistencyPercent,
    totalSolvedInRange: solves.length,
    totalAcceptedInRange: acceptedRows.length,
    comparisonLabel,
  };
}
