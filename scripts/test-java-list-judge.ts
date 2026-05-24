/** Quick check: Java judge serializes List<Integer> as flat JSON array. */
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { JAVA_REFLECT_JUDGE } from "../src/compiler/languages/java/harness.js";

const root = join(import.meta.dirname, "..");
const dir = join(tmpdir(), `cz-judge-list-${Date.now()}`);
mkdirSync(dir, { recursive: true });
copyFileSync(join(root, "src/compiler/judge/runtime/json-org.jar"), join(dir, "json-org.jar"));
writeFileSync(join(dir, "Judge.java"), JAVA_REFLECT_JUDGE);
writeFileSync(
  join(dir, "Solution.java"),
  `import java.util.*;
class Solution {
  public List<Integer> spiralOrder(int[][] mat) {
    List<Integer> ans = new LinkedList<>();
    ans.add(1); ans.add(2); ans.add(3); ans.add(6); ans.add(9); ans.add(8); ans.add(7); ans.add(4); ans.add(5);
    return ans;
  }
}`,
);
writeFileSync(
  join(dir, "cases.json"),
  JSON.stringify({
    functionName: "spiralOrder",
    cases: [
      {
        input: JSON.stringify({ args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]] }),
        expected: "[1,2,3,6,9,8,7,4,5]",
        hidden: false,
      },
    ],
  }),
);

// Judge reads /workspace/cases.json — symlink via docker is heavy; patch path for local test:
const judgeLocal = JAVA_REFLECT_JUDGE.replace(
  'Path.of("/workspace/cases.json")',
  'Path.of("cases.json")',
);
writeFileSync(join(dir, "Judge.java"), judgeLocal);

execSync("javac -encoding UTF-8 -cp json-org.jar *.java", { cwd: dir, stdio: "inherit" });
const out = execSync("java -cp .;json-org.jar Judge", { cwd: dir, encoding: "utf8" });
const parsed = JSON.parse(out) as { results: { actual: string; passed: boolean }[] };
const actual = parsed.results[0]!.actual;
const passed = parsed.results[0]!.passed;
console.log({ actual, passed });
if (actual !== "[1,2,3,6,9,8,7,4,5]" || !passed) {
  console.error("FAIL: expected flat array and passed=true");
  process.exit(1);
}
console.log("OK");
