import {
  addCalendarDays,
  computeRevisionSchedules,
  isWeeklyVisible,
  weekClosingSundayForSolve,
} from "./autoRevision.schedule.js";

const TZ = "Asia/Kolkata";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function solveAt(iso: string): Date {
  return new Date(iso);
}

/** Monday solve → daily Tuesday; weekly opens that week's Sunday. */
{
  const solvedAt = solveAt("2026-05-18T10:00:00+05:30"); // Monday
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  assert(schedules.daily === "2026-05-19", `daily got ${schedules.daily}`);
  assert(schedules.weekly === "2026-05-24", `weekly got ${schedules.weekly}`);
  assert(schedules.monthly === "2026-06-01", `monthly got ${schedules.monthly}`);
  assert(!isWeeklyVisible(schedules.weekly, "2026-05-20", TZ), "not visible before Sunday");
  assert(isWeeklyVisible(schedules.weekly, "2026-05-24", TZ), "visible on closing Sunday");
  assert(isWeeklyVisible(schedules.weekly, "2026-05-30", TZ), "visible through next Saturday");
  assert(!isWeeklyVisible(schedules.weekly, "2026-06-01", TZ), "rolls to monthly on rollover Sunday");
}

/** Friday solve → weekly opens upcoming Sunday of same week. */
{
  const solvedAt = solveAt("2026-05-22T18:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  assert(schedules.weekly === "2026-05-24", `Friday weekly got ${schedules.weekly}`);
}

/** Sunday solve → batch opens that Sunday. */
{
  const solvedAt = solveAt("2026-05-24T09:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  assert(schedules.weekly === "2026-05-24", `Sunday weekly got ${schedules.weekly}`);
  assert(isWeeklyVisible(schedules.weekly, "2026-05-24", TZ), "visible on solve Sunday");
}

/** weekClosingSundayForSolve matches computeRevisionSchedules weekly anchor. */
{
  const key = "2026-05-20";
  assert(
    weekClosingSundayForSolve(key, TZ) === "2026-05-24",
    "Wed solve closes on Sunday",
  );
}

/** Daily is always solve + 1 day. */
{
  const solvedAt = solveAt("2026-05-23T10:00:00+05:30");
  const schedules = computeRevisionSchedules(solvedAt, TZ);
  assert(schedules.daily === addCalendarDays("2026-05-23", 1, TZ), "daily is D+1");
}

console.log("autoRevision.schedule.test.ts: ok");
