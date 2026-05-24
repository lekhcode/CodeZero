/**
 * Integration: Java harness serializes return values without spurious array wrapping.
 * Requires JDK on PATH.
 */
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { JAVA_REFLECT_JUDGE } from "../src/compiler/languages/java/harness.js";

const root = join(import.meta.dirname, "..");
const jar = join(root, "src/compiler/judge/runtime/json-org.jar");

type CaseSpec = {
  name: string;
  solution: string;
  functionName: string;
  args: unknown[];
  expected: string;
};

const CASES: CaseSpec[] = [
  {
    name: "List<Integer> flat",
    functionName: "spiralOrder",
    solution: `import java.util.*;
class Solution {
  public List<Integer> spiralOrder(int[][] mat) {
    return Arrays.asList(1,2,3,6,9,8,7,4,5);
  }
}`,
    args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
    expected: "[1,2,3,6,9,8,7,4,5]",
  },
  {
    name: "int[] flat",
    functionName: "twoSum",
    solution: `class Solution {
  public int[] twoSum(int[] nums, int target) { return new int[] {0, 1}; }
}`,
    args: [[2, 7, 11, 15], 9],
    expected: "[0,1]",
  },
  {
    name: "List<List<Integer>> 2D",
    functionName: "combine",
    solution: `import java.util.*;
class Solution {
  public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> out = new ArrayList<>();
    out.add(Arrays.asList(1, 2));
    out.add(Arrays.asList(3));
    return out;
  }
}`,
    args: [4, 2],
    expected: "[[1,2],[3]]",
  },
  {
    name: "int[][] 2D",
    functionName: "matrix",
    solution: `class Solution {
  public int[][] matrix() { return new int[][] {{1,2},{3,4}}; }
}`,
    args: [],
    expected: "[[1,2],[3,4]]",
  },
  {
    name: "int scalar",
    functionName: "max",
    solution: `class Solution {
  public int max(int[] nums) { return 42; }
}`,
    args: [[1, 2, 3]],
    expected: "42",
  },
  {
    name: "boolean scalar",
    functionName: "isValid",
    solution: `class Solution {
  public boolean isValid(int x) { return true; }
}`,
    args: [1],
    expected: "true",
  },
];

function runCase(spec: CaseSpec): void {
  const dir = join(tmpdir(), `cz-java-ser-${spec.name.replace(/\W+/g, "_")}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  copyFileSync(jar, join(dir, "json-org.jar"));
  const judge = JAVA_REFLECT_JUDGE.replace('Path.of("/workspace/cases.json")', 'Path.of("cases.json")');
  writeFileSync(join(dir, "Judge.java"), judge);
  writeFileSync(join(dir, "Solution.java"), spec.solution);
  writeFileSync(
    join(dir, "cases.json"),
    JSON.stringify({
      functionName: spec.functionName,
      cases: [
        {
          input: JSON.stringify({ args: spec.args }),
          expected: spec.expected,
          hidden: false,
        },
      ],
    }),
  );
  execSync("javac -encoding UTF-8 -cp json-org.jar *.java", { cwd: dir, stdio: "pipe" });
  const out = execSync("java -cp .;json-org.jar Judge", { cwd: dir, encoding: "utf8" });
  const parsed = JSON.parse(out) as { results: { actual: string; passed: boolean }[] };
  const { actual, passed } = parsed.results[0]!;
  if (!passed || actual !== spec.expected) {
    throw new Error(
      `${spec.name}: expected actual=${spec.expected} passed=true; got actual=${actual} passed=${passed}`,
    );
  }
  console.log(`  ok ${spec.name}`);
}

console.log("Java judge serialization:");
for (const spec of CASES) {
  runCase(spec);
}
console.log("All Java serialization cases passed.");
