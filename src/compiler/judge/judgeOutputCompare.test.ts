import assert from "node:assert/strict";
import {
  normalizeJudgeHarnessResults,
  normalizeNestedListActualString,
  outputsMatch,
  relaxJudgeTestResults,
} from "./judgeOutputCompare.js";
import type { JudgeCasePayload } from "./writeJudgeWorkspace.js";

const twoSumInput = '{"args":[[1,5,3,7],8]}';

assert.equal(outputsMatch(twoSumInput, "[0,3]", "[0,3]"), true);
assert.equal(outputsMatch(twoSumInput, "[0,3]", "[1,2]"), true);
assert.equal(outputsMatch(twoSumInput, "[0,3]", "[3,0]"), true);
assert.equal(outputsMatch(twoSumInput, "[0,3]", "[0,1]"), false);

const multiInput = '{"args":[[10,20,30,40,50],70]}';
assert.equal(outputsMatch(multiInput, "[1,4]", "[2,3]"), true);

assert.equal(outputsMatch('{"args":[[2,7,11,15],9]}', "[0,1]", "[1,0]"), true);

const combos =
  '{"args":[[1,2,3],3]}';
assert.equal(
  outputsMatch(combos, "[[1,2]]", "[[2,1]]"),
  true,
);
assert.equal(
  outputsMatch(
    combos,
    "[[1,2],[3]]",
    "[[3],[1,2]]",
  ),
  true,
);

const cases: JudgeCasePayload[] = [
  { input: twoSumInput, expected: "[0,3]", hidden: true },
];
const relaxed = relaxJudgeTestResults(
  [{ index: 0, passed: false, actual: "[1,2]", expected: "[0,3]" }],
  cases,
);
assert.equal(relaxed[0]!.passed, true);

assert.equal(
  normalizeNestedListActualString("[[1,2,3,6,9,8,7,4,5]]", "[1,2,3,6,9,8,7,4,5]"),
  "[1,2,3,6,9,8,7,4,5]",
);
assert.equal(outputsMatch('{"args":[[[1,2,3],[4,5,6],[7,8,9]]]}', "[1,2,3,6,9,8,7,4,5]", "[[1,2,3,6,9,8,7,4,5]]"), true);

const spiralCases: JudgeCasePayload[] = [
  {
    input: '{"args":[[[1,2,3],[4,5,6],[7,8,9]]]}',
    expected: "[1,2,3,6,9,8,7,4,5]",
    hidden: false,
  },
];
const normalized = normalizeJudgeHarnessResults(
  [{ index: 0, passed: false, actual: "[[1,2,3,6,9,8,7,4,5]]" }],
  spiralCases,
);
assert.equal(normalized[0]!.actual, "[1,2,3,6,9,8,7,4,5]");
assert.equal(normalized[0]!.passed, true);

console.log("judgeOutputCompare tests passed");
