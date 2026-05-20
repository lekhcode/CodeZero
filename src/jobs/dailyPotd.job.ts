import { logger } from "../config/logger.js";
import { getTodayDailyProblem } from "../modules/leetcode/leetcode.service.js";

let syncInFlight = false;

/**
 * Sync today's LeetCode POTD into `problems` + `daily_potd`.
 * Same work as `GET /api/v1/daily-problem` — safe to run repeatedly (upserts).
 */
export async function runDailyPotdSync(trigger: "cron" | "manual"): Promise<void> {
  if (syncInFlight) {
    logger.warn({ trigger }, "daily POTD sync skipped — already running");
    return;
  }

  syncInFlight = true;
  const started = Date.now();

  try {
    const problem = await getTodayDailyProblem();
    logger.info(
      {
        trigger,
        slug: problem.slug,
        title: problem.title,
        durationMs: Date.now() - started,
      },
      "daily POTD sync succeeded",
    );
  } catch (err) {
    logger.error({ err, trigger, durationMs: Date.now() - started }, "daily POTD sync failed");
    throw err;
  } finally {
    syncInFlight = false;
  }
}
