import { readFileSync, writeFileSync } from "fs";
const path = "src/modules/leetcode/leetcode.parser.ts";
let s = readFileSync(path, "utf8");

const newExtract = `export function extractExamplesFromHtml(html: string): ProblemExample[] {
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
  const preRegex = /<pre[^>]*>([\\s\\S]*?)<\\/pre>/gi;
  let m: RegExpExecArray | null;
  while ((m = preRegex.exec(html)) !== null) {
    const block = m[1] ?? "";
    if (!/<strong>\\s*Input:/i.test(block)) continue;
    const parsed = parseExamplePreBlock(block);
    if (parsed !== null) examples.push(parsed);
  }
  return examples;
}

/** Newer LeetCode layout: <div class="example-block"> with Input/Output in <p> + <span class="example-io"> */
function extractExamplesFromExampleBlocks(html: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  const pairRegex =
    /<p>\\s*<strong>\\s*Input:\\s*<\\/strong>\\s*(?:<span[^>]*>)?([\\s\\S]*?)(?:<\\/span>)?\\s*<\\/p>\\s*<p>\\s*<strong>\\s*Output:\\s*<\\/strong>\\s*(?:<span[^>]*>)?([\\s\\S]*?)(?:<\\/span>)?\\s*<\\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pairRegex.exec(html)) !== null) {
    const input = htmlToPlainText(m[1] ?? "").trim();
    const output = htmlToPlainText(m[2] ?? "").trim();
    if (input.length === 0) continue;
    examples.push({ input, output, explanation: "" });
  }
  return examples;
}

`;

if (!s.includes("extractExamplesFromExampleBlocks")) {
  s = s.replace(
    /export function extractExamplesFromHtml\(html: string\): ProblemExample\[\] \{[\s\S]*?return examples;\n\}/,
    newExtract.trim(),
  );
  s = s.replace(
    /\n\/\*\*\n \* Build structured examples from LeetCode fields\.[\s\S]*?\*\/\s*\n\n\/\*\* True when/,
    "\n/** True when",
  );
  writeFileSync(path, s);
  console.log("parser updated");
} else {
  console.log("parser already has example-block support");
}
