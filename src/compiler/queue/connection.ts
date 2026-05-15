import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { compilerLogger } from "../utils/logger.js";

let sharedConnection: Redis | null = null;

/**
 * Single Redis connection factory for BullMQ.
 * `maxRetriesPerRequest: null` is required for BullMQ workers (blocking commands).
 */
export function getRedisConnection(): Redis {
  if (sharedConnection === null) {
    sharedConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 5_000);
        compilerLogger.warn({ times, delay }, "redis reconnecting");
        return delay;
      },
    });

    sharedConnection.on("connect", () => {
      compilerLogger.info("redis connected");
    });

    sharedConnection.on("error", (err: Error) => {
      compilerLogger.error({ err }, "redis error");
    });
  }
  return sharedConnection;
}

export async function closeRedisConnection(): Promise<void> {
  if (sharedConnection !== null) {
    await sharedConnection.quit();
    sharedConnection = null;
  }
}
