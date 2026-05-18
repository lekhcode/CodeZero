/** UTC calendar date `YYYY-MM-DD` — matches backend assignment / POTD day boundaries. */
export function getUtcDateKey(reference = new Date()): string {
  return reference.toISOString().slice(0, 10);
}

/** Whole UTC days between `dateKey` and `todayKey` (todayKey − dateKey). */
export function utcDaysBeforeToday(dateKey: string, todayKey: string): number {
  const a = Date.parse(`${dateKey}T00:00:00.000Z`);
  const b = Date.parse(`${todayKey}T00:00:00.000Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Human label for an overdue assignment day (relative to UTC today). */
export function formatOverdueDayLabel(dateKey: string, todayKey: string): string {
  const daysAgo = utcDaysBeforeToday(dateKey, todayKey);
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo === 2) return "2 days ago";
  if (daysAgo > 2 && daysAgo <= 7) return `${daysAgo} days ago`;
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
