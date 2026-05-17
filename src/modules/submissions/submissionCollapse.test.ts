import assert from "node:assert/strict";
import { collapseConsecutiveByProblem } from "./submissionCollapse.js";

type Row = { problemId: string; id: string };

function run() {
  const rows: Row[] = [
    { id: "a3", problemId: "p1" },
    { id: "a2", problemId: "p1" },
    { id: "b1", problemId: "p2" },
    { id: "a1", problemId: "p1" },
  ];

  const collapsed = collapseConsecutiveByProblem(rows);
  assert.equal(collapsed.length, 3);
  assert.equal(collapsed[0]?.representative.id, "a3");
  assert.equal(collapsed[0]?.collapsedAttempts, 2);
  assert.equal(collapsed[1]?.representative.id, "b1");
  assert.equal(collapsed[2]?.representative.id, "a1");
  assert.equal(collapsed[2]?.collapsedAttempts, 1);

  const single = collapseConsecutiveByProblem([
    { id: "x1", problemId: "p1" },
    { id: "x2", problemId: "p1" },
    { id: "x3", problemId: "p1" },
  ]);
  assert.equal(single.length, 1);
  assert.equal(single[0]?.collapsedAttempts, 3);

  console.log("submissionCollapse.test.ts: ok");
}

run();
