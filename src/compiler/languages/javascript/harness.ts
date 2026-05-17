/** Loads prelude-wrapped {@code submission.js} and runs cases. */
export const JS_JUDGE_HARNESS = `
const fs = require("fs");

function norm(v) {
  return JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x)));
}

const bundle = JSON.parse(fs.readFileSync("/workspace/cases.json", "utf8"));
const fn = bundle.functionName;
const cases = bundle.cases;

const { Solution } = require("./submission.js");
const sol = new Solution();

const results = [];
let maxRunMs = 0;

for (let idx = 0; idx < cases.length; idx++) {
  const tc = cases[idx];
  const hidden = Boolean(tc.hidden);
  try {
    const argsObj = JSON.parse(tc.input);
    const args = argsObj.args;
    const expected = JSON.parse(tc.expected);

    const t0 = performance.now();
    const actual = sol[fn](...args);
    const runMs = Math.round(performance.now() - t0);
    maxRunMs = Math.max(maxRunMs, runMs);
    const ok = JSON.stringify(norm(actual)) === JSON.stringify(norm(expected));
    results.push({
      index: idx,
      passed: ok,
      runTimeMs: runMs,
      actual: JSON.stringify(actual),
      expected: JSON.stringify(expected),
      inputPreview: tc.input.slice(0, 200),
      hidden,
    });
  } catch (e) {
    const msg = e && e.stack ? String(e.stack) : String(e);
    results.push({
      index: idx,
      passed: false,
      error: msg.slice(0, 2400),
      hidden,
    });
  }
}

process.stdout.write(JSON.stringify({ results, executionTimeMs: maxRunMs }, null, 0));
`.trimStart();
