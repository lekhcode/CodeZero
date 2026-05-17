import { readFileSync, writeFileSync } from "fs";
const path = "src/modules/leetcode/leetcode.mapper.ts";
let m = readFileSync(path, "utf8");
if (!m.includes("resolveProblemExamples,")) {
  m = m.replace(
    /import \{\s*extractConstraintsFromHtml,\s*extractStatementFromHtml,\s*parseExamples,\s*\} from "\.\/leetcode\.parser\.js";/,
    `import {
  examplesHaveOutput,
  extractConstraintsFromHtml,
  extractExamplesFromHtml,
  extractStatementFromHtml,
  parseExamples,
  resolveProblemExamples,
} from "./leetcode.parser.js";`,
  );
}
if (!m.includes("hasCompleteStoredExamples")) {
  m = m.replace(
    /export function hasStoredExamples\(row: Problem\): boolean \{\s*return readStoredExamples\(row\) !== null;\s*\}\s*\/\*\* Rebuild API response[\s\S]*?const examples = readStoredExamples\(row\) \?\? parseExamples\(row\.exampleTestcases, null\);/,
    `export function hasStoredExamples(row: Problem): boolean {
  return readStoredExamples(row) !== null;
}

export function hasCompleteStoredExamples(row: Problem): boolean {
  const stored = readStoredExamples(row);
  return stored !== null && examplesHaveOutput(stored);
}

function resolveExamplesForProblemRow(row: Problem): ProblemExample[] {
  const stored = readStoredExamples(row);
  if (stored !== null && examplesHaveOutput(stored)) return stored;
  if (row.rawContent !== null && row.rawContent.trim().length > 0) {
    const fromHtml = extractExamplesFromHtml(row.rawContent);
    if (fromHtml.length > 0 && examplesHaveOutput(fromHtml)) return fromHtml;
  }
  if (stored !== null) return stored;
  return parseExamples(row.exampleTestcases, null);
}

/** Rebuild API response from a DB row (persisted examples, else re-parse testcase string). */
export function mapProblemRowToDetailResponse(row: Problem): ProblemDetailResponse {
  const examples = resolveExamplesForProblemRow(row);`,
  );
}
writeFileSync(path, m);
console.log("mapper fixed");
