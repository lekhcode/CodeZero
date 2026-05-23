/**
 * Calendar scheduling for Smart Auto-Revision (IANA timezone via Intl).
 *
 * Phases:
 * - Daily: due the day after solve (yesterday's solves only in Today).
 * - Weekly: batch opens on the Mon–Sun week's closing Sunday; visible through the following Sat.
 * - Monthly: batch enters on the rollover Sunday (weekly close + 8 days).
 */

export type RevisionScheduleDates = {
  daily: string;
  weekly: string;
  monthly: string;
};

type Ymd = { year: number; month: number; day: number };

function parseDateKey(dateKey: string): Ymd {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { year: y!, month: m!, day: d! };
}

function formatDateKey({ year, month, day }: Ymd): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` for an instant in the given IANA timezone. */
export function toDateKey(instant: Date, timeZone: string): string {
  return instant.toLocaleDateString("en-CA", { timeZone });
}

function getYmdInTimezone(instant: Date, timeZone: string): Ymd {
  const key = toDateKey(instant, timeZone);
  return parseDateKey(key);
}

/** Day of week: 0 = Sunday … 6 = Saturday (in timezone). */
export function getDayOfWeek(instant: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(instant);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/** Day of week for a calendar date key (noon anchor in TZ). */
export function getDayOfWeekForDateKey(dateKey: string, timeZone: string): number {
  const { year, month, day } = parseDateKey(dateKey);
  const noonUtc = zonedNoonToUtc(year, month, day, timeZone);
  return getDayOfWeek(new Date(noonUtc), timeZone);
}

/** Add calendar days to a date key (noon anchor in TZ reduces DST drift). */
export function addCalendarDays(dateKey: string, days: number, timeZone: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const noonUtc = zonedNoonToUtc(year, month, day, timeZone);
  const next = new Date(noonUtc + days * 86_400_000);
  return toDateKey(next, timeZone);
}

function zonedNoonToUtc(year: number, month: number, day: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day, 12, 0, 0);
  const offset = getTimezoneOffsetMs(new Date(guess), timeZone);
  return guess - offset;
}

function getTimezoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "numeric",
  }).formatToParts(instant);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const hours = Number(m[2]);
  const mins = m[3] ? Number(m[3]) : 0;
  return sign * (hours * 60 + mins) * 60_000;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function lastDayOfMonthKey(year: number, month: number): string {
  const day = daysInMonth(year, month);
  return formatDateKey({ year, month, day });
}

/**
 * Closing Sunday of the Mon–Sun week that contains `solveKey`.
 * Solves on Sunday use that same Sunday as the batch opener.
 */
export function weekClosingSundayForSolve(solveKey: string, timeZone: string): string {
  const dow = getDayOfWeekForDateKey(solveKey, timeZone);
  if (dow === 0) return solveKey;
  return addCalendarDays(solveKey, 7 - dow, timeZone);
}

/** Sunday when a weekly batch graduates into the monthly archive. */
export function weeklyRolloverSunday(weeklyBatchSunday: string, timeZone: string): string {
  return addCalendarDays(weeklyBatchSunday, 8, timeZone);
}

/**
 * Compute D+1 daily, week-closing Sunday weekly, and rollover Sunday monthly.
 */
export function computeRevisionSchedules(solvedAt: Date, timeZone: string): RevisionScheduleDates {
  const solveKey = toDateKey(solvedAt, timeZone);
  const daily = addCalendarDays(solveKey, 1, timeZone);
  const weekly = weekClosingSundayForSolve(solveKey, timeZone);
  const monthly = weeklyRolloverSunday(weekly, timeZone);
  return { daily, weekly, monthly };
}

/**
 * Weekly batch is visible from its closing Sunday through the following Saturday
 * (inclusive). On the rollover Sunday it moves to Monthly.
 */
export function isWeeklyVisible(weeklyBatchSunday: string, todayKey: string, timeZone: string): boolean {
  if (todayKey < weeklyBatchSunday) return false;
  const rollover = weeklyRolloverSunday(weeklyBatchSunday, timeZone);
  return todayKey < rollover;
}

/** @deprecated Use isWeeklyVisible — kept for transitional imports. */
export function isWeeklyDueOnDate(weeklyBatchSunday: string, todayKey: string, timeZone: string): boolean {
  return isWeeklyVisible(weeklyBatchSunday, todayKey, timeZone);
}

/** Monthly archive row is visible on/after its rollover Sunday. */
export function isMonthlyVisible(monthlyScheduledFor: string, todayKey: string): boolean {
  return todayKey >= monthlyScheduledFor;
}

/** Prisma date bounds for weekly rows active on `todayKey` (closing Sun → following Sat). */
export function weeklyVisibleScheduledForRange(
  todayKey: string,
  timeZone: string,
): { gt: Date; lte: Date } {
  const after = addCalendarDays(todayKey, -8, timeZone);
  return {
    gt: new Date(`${after}T00:00:00.000Z`),
    lte: new Date(`${todayKey}T00:00:00.000Z`),
  };
}

export function weekRangeForOffset(weekOffset: number, timeZone: string, reference = new Date()): {
  start: string;
  end: string;
  label: string;
} {
  const todayKey = toDateKey(reference, timeZone);
  const dow = getDayOfWeek(reference, timeZone);
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const mondayThisWeek = addCalendarDays(todayKey, mondayOffset, timeZone);
  const monday = addCalendarDays(mondayThisWeek, weekOffset * 7, timeZone);
  const sunday = addCalendarDays(monday, 6, timeZone);
  const startLabel = formatShortLabel(monday, timeZone);
  const endLabel = formatShortLabel(sunday, timeZone);
  return {
    start: monday,
    end: sunday,
    label: `${startLabel} – ${endLabel}`,
  };
}

function formatShortLabel(dateKey: string, timeZone: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const utc = zonedNoonToUtc(year, month, day, timeZone);
  return new Date(utc).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function monthRangeForOffset(monthOffset: number, timeZone: string, reference = new Date()): {
  start: string;
  end: string;
  label: string;
} {
  const ymd = getYmdInTimezone(reference, timeZone);
  let year = ymd.year;
  let month = ymd.month + monthOffset;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  const start = formatDateKey({ year, month, day: 1 });
  const end = lastDayOfMonthKey(year, month);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, label };
}
