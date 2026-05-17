import { readFileSync, writeFileSync } from "fs";

const parserPath = "src/modules/leetcode/leetcode.parser.ts";
let parser = readFileSync(parserPath, "utf8");

const insert = `
/** True when at least one example has a non-empty expected output (LeetCode-style). */
export function examplesHaveOutput(examples: ProblemExample[]): boolean {
  return examples.some((e) => e.output.trim().length > 0);
}

/**
 * Parse Example 1 / Example 2 blocks from LeetCode \`content\` HTML (Input + Output + optional Explanation).
 */
export function extractExamplesFromHtml(html: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const preRegex = /<pre[^>]*>([\\s\\S]*?)<\\/pre>/gi;
  let m: RegExpExecArray | null;
  while ((m = preRegex.exec(html)) !== null) {
    const block = m[1] ?? "";
    if (!/<strong>\\s*Input:/i.test(block)) {
      continue;
    }
    const parsed = parseExamplePreBlock(block);
    if (parsed !== null) {
      examples.push(parsed);
    }
  }
  return examples;
}

function parseExamplePreBlock(htmlBlock: string): ProblemExample | null {
  const inputMatch = /<strong>\\s*Input:\\s*<\\/strong>\\s*([\\s\\S]*?)(?=<strong>\\s*Output:|<strong>\\s*Explanation:|$)/i.exec(
    htmlBlock,
  );
  if (inputMatch === null) {
    return null;
  }
  const input = htmlToPlainText(inputMatch[1] ?? "").trim();
  if (input.length === 0) {
    return null;
  }

  const outputMatch = /<strong>\\s*Output:\\s*<\\/strong>\\s*([\\s\\S]*?)(?=<strong>\\s*Explanation:|$)/i.exec(
    htmlBlock,
  );
  const explainMatch = /<strong>\\s*Explanation:\\s*<\\/strong>\\s*([\\s\\S]*?)$/i.exec(htmlBlock);

  return {
    input,
    output: outputMatch !== null ? htmlToPlainText(outputMatch[1] ?? "").trim() : "",
    explanation: explainMatch !== null ? htmlToPlainText(explainMatch[1] ?? "").trim() : "",
  };
}

/**
 * Prefer HTML examples (full Input/Output for users); fall back to GraphQL testcase fields (judge inputs).
 */
export function resolveProblemExamples(params: {
  html: string;
  exampleTestcases: string | null | undefined;
  exampleTestcaseList: string[] | null | undefined;
}): ProblemExample[] {
  const fromHtml = extractExamplesFromHtml(params.html);
  if (fromHtml.length > 0 && examplesHaveOutput(fromHtml)) {
    return fromHtml;
  }
  return parseExamples(params.exampleTestcases, params.exampleTestcaseList);
}

`;

if (!parser.includes("extractExamplesFromHtml")) {
  parser = parser.replace(
    "/**\n * Build structured examples from LeetCode fields.",
    insert + "/**\n * Build structured examples from LeetCode GraphQL testcase fields (judge-oriented; may lack outputs).",
  );
  writeFileSync(parserPath, parser);
  console.log("Updated parser");
} else {
  console.log("Parser already patched");
}

// mapper
const mapperPath = "src/modules/leetcode/leetcode.mapper.ts";
let mapper = readFileSync(mapperPath, "utf8");
mapper = mapper.replace(
  `import {
  extractConstraintsFromHtml,
  extractStatementFromHtml,
  parseExamples,
} from "./leetcode.parser.js";`,
  `import {
  examplesHaveOutput,
  extractConstraintsFromHtml,
  extractExamplesFromHtml,
  extractStatementFromHtml,
  parseExamples,
  resolveProblemExamples,
} from "./leetcode.parser.js";`,
);
mapper = mapper.replace(
  "  const examples = parseExamples(payload.exampleTestcases, payload.exampleTestcaseList);",
  `  const examples = resolveProblemExamples({
    html: rawContent,
    exampleTestcases: payload.exampleTestcases,
    exampleTestcaseList: payload.exampleTestcaseList,
  });`,
);
if (!mapper.includes("hasCompleteStoredExamples")) {
  mapper = mapper.replace(
    `export function hasStoredExamples(row: Problem): boolean {
  return readStoredExamples(row) !== null;
}

/** Rebuild API response from a DB row (persisted examples, else re-parse testcase string). */
export function mapProblemRowToDetailResponse(row: Problem): ProblemDetailResponse {
  const examples = readStoredExamples(row) ?? parseExamples(row.exampleTestcases, null);`,
    `export function hasStoredExamples(row: Problem): boolean {
  return readStoredExamples(row) !== null;
}

export function hasCompleteStoredExamples(row: Problem): boolean {
  const stored = readStoredExamples(row);
  return stored !== null && examplesHaveOutput(stored);
}

function resolveExamplesForProblemRow(row: Problem): ProblemExample[] {
  const stored = readStoredExamples(row);
  if (stored !== null && examplesHaveOutput(stored)) {
    return stored;
  }
  if (row.rawContent !== null && row.rawContent.trim().length > 0) {
    const fromHtml = extractExamplesFromHtml(row.rawContent);
    if (fromHtml.length > 0 && examplesHaveOutput(fromHtml)) {
      return fromHtml;
    }
  }
  if (stored !== null) {
    return stored;
  }
  return parseExamples(row.exampleTestcases, null);
}

/** Rebuild API response from a DB row (persisted examples, else re-parse testcase string). */
export function mapProblemRowToDetailResponse(row: Problem): ProblemDetailResponse {
  const examples = resolveExamplesForProblemRow(row);`,
  );
}
writeFileSync(mapperPath, mapper);
console.log("Updated mapper");

// service
const servicePath = "src/modules/leetcode/leetcode.service.ts";
let service = readFileSync(servicePath, "utf8");
service = service.replace("hasStoredExamples", "hasCompleteStoredExamples");
writeFileSync(servicePath, service);
console.log("Updated service");
