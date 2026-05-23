import {
  computeRevisionSchedules,
  isWeeklyDueOnDate,
  weekRangeForOffset,
} from "./autoRevision.schedule.js";

const TZ = "Asia/Kolkata";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function solveAt(iso: string): Date {
  return new Date(iso);
}

/** Saturday solve → weekly anchor is that Saturday, inside "this week". */
{
  const solvedAt = solveAt("2026-05-23T10:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  const week = weekRangeForOffset(0, TZ, solvedAt);
  assert(
    schedules.weekly >= week.start && schedules.weekly <= week.end,
    `Saturday weekly ${schedules.weekly} should fall in ${week.start}–${week.end}`,
  );
  assert(schedules.weekly === "2026-05-23", `expected 2026-05-23, got ${schedules.weekly}`);
  assert(
    isWeeklyDueOnDate(schedules.weekly, "2026-05-23", TZ),
    "weekly due on anchor Saturday",
  );
  assert(
    isWeeklyDueOnDate(schedules.weekly, "2026-05-24", TZ),
    "weekly due on Sunday after anchor Saturday",
  );
}

/** Friday solve → upcoming Saturday in the same ISO week. */
{
  const solvedAt = solveAt("2026-05-22T18:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  const week = weekRangeForOffset(0, TZ, solvedAt);
  assert(schedules.weekly === "2026-05-23", `Friday anchor got ${schedules.weekly}`);
  assert(
    schedules.weekly >= week.start && schedules.weekly <= week.end,
    "Friday weekly in current week",
  );
}

/** Sunday solve → previous Saturday anchor, still due that Sunday. */
{
  const solvedAt = solveAt("2026-05-24T09:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  assert(schedules.weekly === "2026-05-23", `Sunday anchor got ${schedules.weekly}`);
  assert(
    isWeeklyDueOnDate(schedules.weekly, "2026-05-24", TZ),
    "Sunday solve due on solve Sunday",
  );
}

console.log("autoRevision.schedule.test.ts: ok");
