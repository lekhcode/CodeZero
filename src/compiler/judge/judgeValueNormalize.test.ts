import assert from "node:assert/strict";
import {
  coalesceSpuriousSingleElementWrapper,
  normalizeHarnessActualString,
} from "./judgeValueNormalize.js";

assert.equal(
  normalizeHarnessActualString("[[1,2,3]]", "[1,2,3]"),
  "[1,2,3]",
);

assert.deepEqual(
  coalesceSpuriousSingleElementWrapper([[1, 2], [3]], [[1, 2], [3]]),
  [[1, 2], [3]],
);

assert.deepEqual(
  coalesceSpuriousSingleElementWrapper([[[1, 2, 3]]], [[1, 2, 3]]),
  [[[1, 2, 3]]],
);

console.log("judgeValueNormalize tests passed");
