import assert from "node:assert/strict";
import {
  expandQueryCompactVariants,
  matchesFlexibleProblemSearch,
  normalizeAlphanumeric,
} from "./problemSearch.utils.js";

assert.equal(normalizeAlphanumeric("Two Sum"), "twosum");
assert.equal(normalizeAlphanumeric("two-sum"), "twosum");

assert.equal(matchesFlexibleProblemSearch("Two Sum", "two-sum", 1, "twosum"), true);
assert.equal(matchesFlexibleProblemSearch("3Sum", "3sum", 15, "three sum"), true);
assert.equal(matchesFlexibleProblemSearch("3Sum", "3sum", 15, "3sum"), true);
assert.equal(matchesFlexibleProblemSearch("3Sum", "3sum", 15, "three"), true);
assert.equal(matchesFlexibleProblemSearch("Two Sum", "two-sum", 1, "1"), true);
assert.equal(matchesFlexibleProblemSearch("Two Sum", "two-sum", 1, "binary tree"), false);

const variants = expandQueryCompactVariants("three sum");
assert.ok(variants.includes("3sum"));
assert.ok(variants.includes("threesum"));

console.log("problemSearch.utils.test.ts: ok");
