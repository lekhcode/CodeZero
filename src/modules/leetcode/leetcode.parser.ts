/**
 * HTML / testcase parsing for LeetCode `content` and `exampleTestcases`.
 *
 * Isolated from HTTP (client) and persistence (service) so we can swap in a richer parser
 * later (e.g. cheerio) without touching fetch or DB code.
 */

import type { ProblemExample } from "./leetcode.types.js";

/** Strip tags and collapse whitespace for a readable statement. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Best-effort constraints extraction from LeetCode HTML.
 * Looks for a "Constraints" heading then bullet lines / following paragraphs.
 */
export function extractConstraintsFromHtml(html: string): string[] {
  const constraints: string[] = [];

  const strongMatch = html.match(
    /<p[^>]*>\s*<strong[^>]*>\s*Constraints?:?\s*<\/strong>\s*<\/p>([\s\S]*?)(?=<p[^>]*>\s*<strong|<\/div>|$)/i,
  );
  const block = strongMatch?.[1] ?? html;

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(block)) !== null) {
    const text = htmlToPlainText(m[1] ?? "");
    if (text.length > 0) {
      constraints.push(text);
    }
  }

  if (constraints.length === 0) {
    const plain = htmlToPlainText(html);
    const idx = plain.search(/\bConstraints?:?\b/i);
    if (idx >= 0) {
      const after = plain.slice(idx).replace(/^Constraints?:?\s*/i, "");
      const lines = after
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !/^constraints?:?$/i.test(l));
      for (const line of lines.slice(0, 12)) {
        if (/^Example\s+\d+/i.test(line) || /^Follow\s*up/i.test(line)) {
          break;
        }
        constraints.push(line.replace(/^[-•*]\s*/, ""));
      }
    }
  }

  return constraints;
}

/**
 * Build structured examples from LeetCode fields.
 * `exampleTestcaseList` is preferred; falls back to splitting `exampleTestcases`.
 */

/** True when at least one example has a non-empty expected output (LeetCode-style). */
export function examplesHaveOutput(examples: ProblemExample[]): boolean {
  return examples.some((e) => e.output.trim().length > 0);
}

/**
 * Legacy dump rows stored the Two Sum *target* (e.g. 9) as "Output" instead of index pairs.
 * Do not treat valid single-number answers (binary search index, count, etc.) as legacy when
 * input uses LeetCode's `param = value` style.
 */
export function looksLikeWrongLegacyExample(ex: ProblemExample): boolean {
  const o = ex.output.trim();
  const i = ex.input.trim();
  if (o.length === 0) return false;
  if (!/^-?\d+$/.test(o)) return false;

  // Named parameters (nums = ..., target = ...) — output is a real scalar answer, not a mistaken target.
  if (/\b[a-zA-Z_]\w*\s*=/.test(i)) return false;

  if (i.startsWith("[")) return true;
  if (i.includes("\n")) return true;
  if (!i.includes("=")) return true;
  return false;
}

export function filterQualityExamples(examples: ProblemExample[]): ProblemExample[] {
  return examples.filter((e) => !looksLikeWrongLegacyExample(e) && e.output.trim().length > 0);
}

/**
 * Parse Example 1 / Example 2 blocks from LeetCode `content` HTML (Input + Output + optional Explanation).
 */
export function extractExamplesFromHtml(html: string): ProblemExample[] {
  const fromPre = extractExamplesFromPreTags(html);
  if (fromPre.length > 0 && examplesHaveOutput(fromPre)) {
    return fromPre;
  }
  const fromBlocks = extractExamplesFromExampleBlocks(html);
  if (fromBlocks.length > 0 && examplesHaveOutput(fromBlocks)) {
    return fromBlocks;
  }
  return fromPre.length > 0 ? fromPre : fromBlocks;
}

function extractExamplesFromPreTags(html: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let m: RegExpExecArray | null;
  while ((m = preRegex.exec(html)) !== null) {
    const block = m[1] ?? "";
    if (!/<strong>\s*Input:/i.test(block)) continue;
    const parsed = parseExamplePreBlock(block);
    if (parsed !== null) examples.push(parsed);
  }
  return examples;
}

/** Newer LeetCode layout: <div class="example-block"> with Input/Output in <p> + <span class="example-io"> */
function extractExamplesFromExampleBlocks(html: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const pairRegex =
    /<p>\s*<strong>\s*Input:\s*<\/strong>\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?\s*<\/p>\s*<p>\s*<strong>\s*Output:\s*<\/strong>\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?\s*<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pairRegex.exec(html)) !== null) {
    const input = htmlToPlainText(m[1] ?? "").trim();
    const output = htmlToPlainText(m[2] ?? "").trim();
    if (input.length === 0) continue;
    examples.push({ input, output, explanation: "" });
  }
  return examples;
}

function parseExamplePreBlock(htmlBlock: string): ProblemExample | null {
  const inputMatch = /<strong>\s*Input:\s*<\/strong>\s*([\s\S]*?)(?=<strong>\s*Output:|<strong>\s*Explanation:|$)/i.exec(
    htmlBlock,
  );
  if (inputMatch === null) {
    return null;
  }
  const input = htmlToPlainText(inputMatch[1] ?? "").trim();
  if (input.length === 0) {
    return null;
  }

  const outputMatch = /<strong>\s*Output:\s*<\/strong>\s*([\s\S]*?)(?=<strong>\s*Explanation:|$)/i.exec(
    htmlBlock,
  );
  const explainMatch = /<strong>\s*Explanation:\s*<\/strong>\s*([\s\S]*?)$/i.exec(htmlBlock);

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

export function parseExamples(
  exampleTestcases: string | null | undefined,
  exampleTestcaseList: string[] | null | undefined,
): ProblemExample[] {
  if (exampleTestcaseList !== null && exampleTestcaseList !== undefined && exampleTestcaseList.length > 0) {
    return exampleTestcaseList.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length >= 2 && lines.every(looksLikeStandaloneInputLine)) {
        return {
          input: lines.join("\n"),
          output: "",
          explanation: "",
        };
      }
      return mapExampleBlock(block);
    });
  }

  if (exampleTestcases === null || exampleTestcases === undefined || exampleTestcases.trim() === "") {
    return [];
  }

  const trimmed = exampleTestcases.trim();

  const blocks = trimmed.split(/\n\n+/).map((b) => b.trim()).filter((b) => b.length > 0);
  if (blocks.length === 0) {
    return [{ input: trimmed, output: "", explanation: "" }];
  }

  if (blocks.length === 1) {
    const multiInput = parseInputOnlyExampleLines(blocks[0]!);
    if (multiInput !== null) {
      return multiInput;
    }
  }

  if (!trimmed.includes("\n\n")) {
    const multiInput = parseInputOnlyExampleLines(trimmed);
    if (multiInput !== null) {
      return multiInput;
    }
  }

  return blocks.map((block) => mapExampleBlock(block));
}

function mapExampleBlock(block: string): ProblemExample {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return {
    input: lines[0] ?? block,
    output: lines[1] ?? "",
    explanation: lines.slice(2).join("\n"),
  };
}

/**
 * LeetCode often stores multiple sample inputs as single-newline lines with no outputs
 * (e.g. `[1,3,5]\n[2,2,2,0,1]`). Treat each line as its own example.
 */
function parseInputOnlyExampleLines(block: string): ProblemExample[] | null {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return null;
  }
  if (!lines.every(looksLikeStandaloneInputLine)) {
    return null;
  }
  return lines.map((input) => ({ input, output: "", explanation: "" }));
}

function looksLikeStandaloneInputLine(line: string): boolean {
  if (/^output\s*[:=]/i.test(line)) {
    return false;
  }
  return /^[\[\d"'(-]/.test(line) || /^[a-zA-Z_]\w*\s*=/.test(line) || /^".*"$/.test(line);
}

function formatJudgeArgsInput(inputJson: string): string {
  try {
    const o = JSON.parse(inputJson) as { args?: unknown[] };
    if (Array.isArray(o.args)) {
      return o.args.map((a) => formatValueLine(a)).join("\n");
    }
  } catch {
    /* ignore */
  }
  return inputJson;
}

function formatValueLine(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function exampleOutputLooksLikeJudgeArg(output: string, expectedOutput: string): boolean {
  const o = output.trim();
  const e = expectedOutput.trim();
  if (e.length === 0) return false;
  if (o.length === 0) return false;
  if (e.startsWith("[") && !o.startsWith("[")) {
    return /^-?\d+$/.test(o);
  }
  return false;
}

/**
 * LeetCode `exampleTestcaseList` lines are often judge args (nums + target), not user-facing outputs.
 * Merge correct outputs from visible judge testcases when available.
 */
export function enrichExamplesWithJudgeTestcases(
  examples: ProblemExample[],
  testcases: Array<{ input: string; expectedOutput: string }>,
): ProblemExample[] {
  if (testcases.length === 0) return examples;

  if (examples.length === 0) {
    return testcases.map((tc) => ({
      input: formatJudgeArgsInput(tc.input),
      output: tc.expectedOutput.trim(),
      explanation: "",
    }));
  }

  const len = Math.max(examples.length, testcases.length);
  const out: ProblemExample[] = [];

  for (let i = 0; i < len; i++) {
    const ex = examples[i];
    const tc = testcases[i];
    if (ex === undefined && tc === undefined) continue;

    if (ex !== undefined && tc === undefined) {
      out.push(ex);
      continue;
    }

    if (ex === undefined && tc !== undefined) {
      out.push({
        input: formatJudgeArgsInput(tc.input),
        output: tc.expectedOutput.trim(),
        explanation: "",
      });
      continue;
    }

    const expected = tc!.expectedOutput.trim();
    const wrongOutput = exampleOutputLooksLikeJudgeArg(ex!.output, expected);
    const input =
      ex!.input.trim().length > 0 && !ex!.input.includes('"args"')
        ? ex!.input
        : formatJudgeArgsInput(tc!.input);

    out.push({
      input,
      output: wrongOutput || ex!.output.trim().length === 0 ? expected : ex!.output,
      explanation: ex!.explanation,
    });
  }

  return out;
}

/** Statement body before constraints/examples sections in HTML. */
export function extractStatementFromHtml(html: string): string {
  const cutPatterns = [
    /<p[^>]*>\s*<strong[^>]*>\s*Constraints?:?\s*<\/strong>/i,
    /<p[^>]*>\s*<strong[^>]*>\s*Example\s*\d*:?\s*<\/strong>/i,
  ];
  let cutAt = html.length;
  for (const pattern of cutPatterns) {
    const match = pattern.exec(html);
    if (match !== null && match.index < cutAt) {
      cutAt = match.index;
    }
  }
  return htmlToPlainText(html.slice(0, cutAt));
}
