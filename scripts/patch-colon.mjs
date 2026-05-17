import { readFileSync, writeFileSync } from "fs";
const path = "src/modules/leetcode/leetcode.parser.ts";
let s = readFileSync(path, "utf8");
s = s.replace(
  /if \(!\/<strong>\\s\*Input:\/i\.test\(block\)\) continue;/,
  'if (!/<strong>\\s*Input:?/i.test(block)) continue;',
);
s = s.replace(
  /const inputMatch = \/<strong>\\s\*Input:\\s*<\\/strong>/,
  'const inputMatch = /<strong>\\s*Input:?\\s*<\\/strong>',
);
s = s.replace(
  /const outputMatch = \/<strong>\\s\*Output:\\s*<\\/strong>/,
  'const outputMatch = /<strong>\\s*Output:?\\s*<\\/strong>',
);
s = s.replace(
  /const explainMatch = \/<strong>\\s\*Explanation:\\s*<\\/strong>/,
  'const explainMatch = /<strong>\\s*Explanation:?\\s*<\\/strong>',
);
s = s.replace(
  /<p>\\s*<strong>\\s*Input:\\s*<\\/strong>/g,
  '<p>\\s*<strong>\\s*Input:?\\s*<\\/strong>',
);
s = s.replace(
  /<p>\\s*<strong>\\s*Output:\\s*<\\/strong>/g,
  '<p>\\s*<strong>\\s*Output:?\\s*<\\/strong>',
);
writeFileSync(path, s);
console.log("patched optional colon in Input/Output");
