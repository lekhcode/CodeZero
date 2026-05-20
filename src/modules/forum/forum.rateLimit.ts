import { ApiError } from "../../utils/ApiError.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LIMITS = {
  post: { max: 8, windowMs: 60 * 60 * 1000 },
  comment: { max: 40, windowMs: 60 * 60 * 1000 },
  like: { max: 120, windowMs: 60 * 60 * 1000 },
} as const;

export type ForumRateLimitAction = keyof typeof LIMITS;

function bucketKey(userId: string, action: ForumRateLimitAction): string {
  return `${action}:${userId}`;
}

/** In-process sliding window — swap for Redis in multi-instance deploys. */
export function assertForumRateLimit(userId: string, action: ForumRateLimitAction): void {
  const { max, windowMs } = LIMITS[action];
  const key = bucketKey(userId, action);
  const now = Date.now();
  const existing = buckets.get(key);

  if (existing === undefined || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= max) {
    throw ApiError.tooManyRequests(`Rate limit exceeded for forum ${action}. Try again later.`);
  }

  existing.count += 1;
}
