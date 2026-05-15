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
export function parseExamples(
  exampleTestcases: string | null | undefined,
  exampleTestcaseList: string[] | null | undefined,
): ProblemExample[] {
  if (exampleTestcaseList !== null && exampleTestcaseList !== undefined && exampleTestcaseList.length > 0) {
    return exampleTestcaseList.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      return {
        input: lines[0] ?? block,
        output: lines[1] ?? "",
        explanation: lines.slice(2).join("\n"),
      };
    });
  }

  if (exampleTestcases === null || exampleTestcases === undefined || exampleTestcases.trim() === "") {
    return [];
  }

  const blocks = exampleTestcases.split(/\n\n+/).map((b) => b.trim()).filter((b) => b.length > 0);
  if (blocks.length === 0) {
    return [{ input: exampleTestcases.trim(), output: "", explanation: "" }];
  }

  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    return {
      input: lines[0] ?? block,
      output: lines[1] ?? "",
      explanation: lines.slice(2).join("\n"),
    };
  });
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
