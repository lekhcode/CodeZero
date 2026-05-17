import assert from "node:assert/strict";
import {
  enrichExamplesWithJudgeTestcases,
  extractExamplesFromHtml,
  examplesHaveOutput,
  looksLikeWrongLegacyExample,
  resolveProblemExamples,
} from "./leetcode.parser.js";
import { mapProblemRowToDetailResponse, readStoredExamples } from "./leetcode.mapper.js";

const html = `<p><strong class="example">Example 1:</strong></p>
<pre><strong>Input:</strong> nums = [1,3,5]
<strong>Output:</strong> 1
</pre>
<p><strong class="example">Example 2:</strong></p>
<pre><strong>Input:</strong> nums = [2,2,2,0,1]
<strong>Output:</strong> 0
</pre>`;

const fromHtml = extractExamplesFromHtml(html);
assert.equal(fromHtml.length, 2);
assert.ok(examplesHaveOutput(fromHtml));
assert.ok(fromHtml[0]!.input.includes("[1,3,5]"));
assert.equal(fromHtml[0]!.output, "1");
assert.ok(fromHtml[1]!.input.includes("[2,2,2,0,1]"));
assert.equal(fromHtml[1]!.output, "0");

const resolved = resolveProblemExamples({
  html,
  exampleTestcases: "[1,3,5]\\n[2,2,2,0,1]",
  exampleTestcaseList: ["[1,3,5]", "[2,2,2,0,1]"],
});
assert.equal(resolved.length, 2);
assert.equal(resolved[0]!.output, "1");

const twoSumList = resolveProblemExamples({
  html: "",
  exampleTestcases: null,
  exampleTestcaseList: ["[2,7,11,15]\n9", "[3,2,4]\n6"],
});
assert.equal(twoSumList.length, 2);
assert.equal(twoSumList[0]!.output, "");
assert.ok(twoSumList[0]!.input.includes("[2,7,11,15]"));

const enriched = enrichExamplesWithJudgeTestcases(twoSumList, [
  { input: '{"args":[[2,7,11,15],9]}', expectedOutput: "[0,1]" },
  { input: '{"args":[[3,2,4],6]}', expectedOutput: "[1,2]" },
]);
assert.equal(enriched[0]!.output, "[0,1]");
assert.equal(enriched[1]!.output, "[1,2]");

const structuredRow = {
  examples: [
    {
      input: { nums: [2, 7, 11, 15], target: 9 },
      output: [0, 1],
      explanation: "nums[0] + nums[1] == 9",
    },
    {
      input: { nums: [3, 2, 4], target: 6 },
      output: [1, 2],
      explanation: "",
    },
  ],
} as { examples: unknown };

assert.ok(
  looksLikeWrongLegacyExample({ input: "[2,7,11,15]", output: "9", explanation: "" }),
);

const fromDb = readStoredExamples(structuredRow as import("@prisma/client").Problem);
assert.ok(fromDb !== null);
assert.equal(fromDb!.length, 2);
assert.ok(fromDb![0]!.input.includes("nums"));
assert.ok(fromDb![0]!.input.includes("target"));
assert.equal(fromDb![0]!.output, "[0,1]");
assert.equal(fromDb![1]!.output, "[1,2]");

const legacyRow = {
  examples: [
    { input: "[2,7,11,15]", output: "9", explanation: "" },
    {
      input: { nums: [3, 2, 4], target: 6 },
      output: [1, 2],
      explanation: "",
    },
  ],
} as { examples: unknown };

const mixed = readStoredExamples(legacyRow as import("@prisma/client").Problem);
assert.ok(mixed !== null);
assert.equal(mixed!.length, 1);
assert.equal(mixed![0]!.output, "[1,2]");

const legacyOnlyRow = {
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "EASY",
  topics: [],
  parsedStatement: "Given an array...",
  rawContent: null,
  exampleTestcases: "[2,7,11,15]\n9",
  examples: [{ input: "[2,7,11,15]", output: "9", explanation: "" }],
  constraints: [],
  isPremium: false,
} as unknown as import("@prisma/client").Problem;

const legacyResolved = mapProblemRowToDetailResponse(legacyOnlyRow);
assert.equal(legacyResolved.examples.length, 0);

console.log("leetcode.parser examples tests passed");
