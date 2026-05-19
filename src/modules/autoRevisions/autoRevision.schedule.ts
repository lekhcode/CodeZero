/**
 * Calendar scheduling for Smart Auto-Revision (IANA timezone via Intl).
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
 * Compute D+1 daily, weekend weekly (Sat anchor; also due Sunday), and month-end monthly.
 */
export function computeRevisionSchedules(solvedAt: Date, timeZone: string): RevisionScheduleDates {
  const solveKey = toDateKey(solvedAt, timeZone);
  const daily = addCalendarDays(solveKey, 1, timeZone);

  const dow = getDayOfWeek(solvedAt, timeZone);
  let weekly: string;
  if (dow === 6) {
    weekly = addCalendarDays(solveKey, 7, timeZone);
  } else if (dow === 0) {
    weekly = addCalendarDays(solveKey, 6, timeZone);
  } else {
    weekly = addCalendarDays(solveKey, 6 - dow, timeZone);
  }

  const { year, month, day } = parseDateKey(solveKey);
  const monthLast = daysInMonth(year, month);
  let monthly: string;
  if (day === monthLast) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    monthly = lastDayOfMonthKey(nextYear, nextMonth);
  } else {
    monthly = lastDayOfMonthKey(year, month);
  }

  return { daily, weekly, monthly };
}

/** Weekly row is due on its Saturday or the following Sunday (same weekend). */
export function isWeeklyDueOnDate(weeklyScheduledFor: string, todayKey: string, timeZone: string): boolean {
  if (weeklyScheduledFor === todayKey) return true;
  const sunday = addCalendarDays(weeklyScheduledFor, 1, timeZone);
  return sunday === todayKey;
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
