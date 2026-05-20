import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { runDailyPotdSync } from "./dailyPotd.job.js";

/**
 * Schedules daily LeetCode POTD sync (same as GET /api/v1/daily-problem).
 * Runs inside the API process — enable only on one instance in multi-node deploys.
 */
export function startDailyPotdCron(): void {
  if (!env.DAILY_POTD_CRON_ENABLED) {
    logger.info("daily POTD cron disabled (set DAILY_POTD_CRON_ENABLED=true to enable)");
    return;
  }

  const { expression, timezone } = env.DAILY_POTD_CRON;

  if (!cron.validate(expression)) {
    throw new Error(`Invalid DAILY_POTD_CRON_EXPRESSION: ${expression}`);
  }

  cron.schedule(
    expression,
    () => {
      void runDailyPotdSync("cron").catch(() => {
        /* errors logged in job */
      });
    },
    { timezone },
  );

  logger.info({ expression, timezone }, "daily POTD cron scheduled");

  // Env change / server restart does not wait until 06:00 — sync once at boot.
  void runDailyPotdSync("cron").catch(() => {
    /* errors logged in job */
  });
}
