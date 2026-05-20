/**
 * Manually sync today's LeetCode daily problem (same as GET /api/v1/daily-problem).
 *
 * Usage: npm run sync:daily-potd
 */
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { runDailyPotdSync } from "../src/jobs/dailyPotd.job.js";

void runDailyPotdSync("manual")
  .then(() => {
    console.log("Daily POTD sync complete.");
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
