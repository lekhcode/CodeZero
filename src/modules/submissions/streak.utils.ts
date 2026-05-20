/** UTC calendar date `YYYY-MM-DD` (matches frontend week belt / assignment days). */
export function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcDays(dateKey: string, delta: number): string {
  const t = Date.parse(`${dateKey}T00:00:00.000Z`) + delta * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Longest run of consecutive UTC calendar days in sorted ascending date keys. */
export function maxConsecutiveDayStreak(sortedDateKeys: string[]): number {
  if (sortedDateKeys.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sortedDateKeys.length; i++) {
    const prev = sortedDateKeys[i - 1]!;
    const cur = sortedDateKeys[i]!;
    if (addUtcDays(prev, 1) === cur) {
      current++;
    } else {
      current = 1;
    }
    if (current > best) best = current;
  }
  return best;
}

/**
 * Active days = at least one ACCEPTED full judge submit that UTC day.
 * If today is not active yet, count backward from yesterday (day still in progress).
 * Any gap breaks the streak.
 */
export function currentStreakFromActiveDays(activeDays: ReadonlySet<string>, todayKey: string): number {
  let start = todayKey;
  if (!activeDays.has(start)) {
    start = addUtcDays(todayKey, -1);
    if (!activeDays.has(start)) return 0;
  }

  let streak = 0;
  let cursor = start;
  while (activeDays.has(cursor)) {
    streak++;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}
