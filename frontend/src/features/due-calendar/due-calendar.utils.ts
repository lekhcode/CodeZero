import type { CalendarDotTone, DayCell } from "./due-calendar.types";
import { getUtcDateKey } from "@/utils/date";

export function monthRangeKeys(year: number, monthIndex: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, monthIndex, 1));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { from: getUtcDateKey(from), to: getUtcDateKey(to) };
}

export function addUtcDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + delta));
  return getUtcDateKey(next);
}

export function getWeekDateKeys(reference = new Date()): string[] {
  const ref = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const start = new Date(ref);
  start.setUTCDate(ref.getUTCDate() - ref.getUTCDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    return getUtcDateKey(day);
  });
}

export function weekBoundsFromKeys(days: string[]): { from: string; to: string } {
  return { from: days[0]!, to: days[days.length - 1]! };
}

export function dayActivityTotal(cell: DayCell | undefined): number {
  if (cell === undefined) return 0;
  return cell.assignmentDue + cell.revisionDue;
}

export function dayDoneTotal(cell: DayCell | undefined): number {
  if (cell === undefined) return 0;
  return cell.assignmentDone + cell.revisionDone;
}

export function dotToneForDay(cell: DayCell | undefined): CalendarDotTone {
  const total = dayActivityTotal(cell);
  if (total === 0) return "none";
  const done = dayDoneTotal(cell);
  if (done === total) return "success";
  if (done > 0) return "warning";
  return "danger";
}

export const DOT_COLORS: Record<Exclude<CalendarDotTone, "none">, string> = {
  success: "#22C55E",
  warning: "#F6C360",
  danger: "#EF4444",
};

export function findDefaultSelectedDate(
  days: DayCell[],
  todayKey: string,
  preferred?: string,
): string {
  if (preferred !== undefined && preferred <= todayKey) {
    return preferred;
  }

  const todayCell = days.find((d) => d.date === todayKey);
  if (todayCell !== undefined && dayActivityTotal(todayCell) > 0) {
    return todayKey;
  }

  for (let i = days.length - 1; i >= 0; i--) {
    const cell = days[i];
    if (cell !== undefined && dayActivityTotal(cell) > 0) {
      return cell.date;
    }
  }

  return todayKey;
}

export function buildCalendarGrid(year: number, monthIndex: number): Array<string | null> {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const leading = first.getUTCDay();
  const cells: Array<string | null> = [];

  for (let i = 0; i < leading; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= last.getUTCDate(); day++) {
    cells.push(getUtcDateKey(new Date(Date.UTC(year, monthIndex, day))));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}
