/**
 * End-to-end compiler smoke test (API + Redis + worker must be running).
 * Usage: node scripts/test-compiler.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://localhost:3000";

const cases = [
  {
    name: "javascript",
    body: { language: "javascript", code: 'console.log("CodeZero", 2 + 2);', stdin: "" },
    expectStdout: "CodeZero",
  },
  {
    name: "python",
    body: { language: "python", code: 'print("py-ok", 3 * 3)', stdin: "" },
    expectStdout: "py-ok",
  },
  {
    name: "cpp",
    body: {
      language: "cpp",
      code: `#include <iostream>\nusing namespace std;\nint main(){ cout << "cpp-ok"; return 0; }`,
      stdin: "",
    },
    expectStdout: "cpp-ok",
  },
  {
    name: "java",
    body: {
      language: "java",
      code: `public class Main { public static void main(String[] a){ System.out.print("java-ok"); } }`,
      stdin: "",
    },
    expectStdout: "java-ok",
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runCase(testCase) {
  const createRes = await fetch(`${base}/api/v1/compiler/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testCase.body),
  });
  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`${testCase.name} create failed ${createRes.status}: ${t}`);
  }
  const created = await createRes.json();
  const id = created.data?.submissionId;
  if (!id) throw new Error(`${testCase.name}: no submissionId`);

  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    const pollRes = await fetch(`${base}/api/v1/compiler/submissions/${id}`);
    const poll = await pollRes.json();
    const sub = poll.data?.submission;
    if (!sub) throw new Error(`${testCase.name}: invalid poll response`);
    if (sub.status === "QUEUED" || sub.status === "RUNNING") continue;
    const ok =
      sub.status === "ACCEPTED" && (sub.stdout ?? "").includes(testCase.expectStdout);
    return { name: testCase.name, status: sub.status, stdout: sub.stdout, stderr: sub.stderr, ok };
  }
  throw new Error(`${testCase.name}: timeout waiting for result`);
}

async function main() {
  console.log(`Testing compiler at ${base}\n`);
  let passed = 0;
  for (const c of cases) {
    try {
      const r = await runCase(c);
      if (r.ok) {
        passed++;
        console.log(`✓ ${c.name} → ${r.status} (${r.stdout?.trim()})`);
      } else {
        console.log(`✗ ${c.name} → ${r.status}`);
        console.log(`  stdout: ${r.stdout}`);
        console.log(`  stderr: ${r.stderr}`);
      }
    } catch (err) {
      console.log(`✗ ${c.name} → ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\n${passed}/${cases.length} passed`);
  process.exit(passed === cases.length ? 0 : 1);
}

void main();
