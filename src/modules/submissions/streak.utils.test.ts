import assert from "node:assert/strict";
import {
  addUtcDays,
  currentStreakFromActiveDays,
  maxConsecutiveDayStreak,
} from "./streak.utils.js";

assert.equal(maxConsecutiveDayStreak([]), 0);
assert.equal(
  maxConsecutiveDayStreak(["2026-05-10", "2026-05-11", "2026-05-13", "2026-05-14", "2026-05-15"]),
  3,
);

const active = new Set(["2026-05-17", "2026-05-18", "2026-05-19"]);
assert.equal(currentStreakFromActiveDays(active, "2026-05-19"), 3);
assert.equal(currentStreakFromActiveDays(active, "2026-05-20"), 3);
assert.equal(currentStreakFromActiveDays(active, "2026-05-21"), 0);

const broken = new Set(["2026-05-17", "2026-05-19"]);
assert.equal(currentStreakFromActiveDays(broken, "2026-05-19"), 1);
assert.equal(currentStreakFromActiveDays(broken, "2026-05-20"), 1);
assert.equal(currentStreakFromActiveDays(broken, "2026-05-21"), 0);

assert.equal(addUtcDays("2026-05-19", -1), "2026-05-18");

console.log("streak.utils.test.ts: ok");
