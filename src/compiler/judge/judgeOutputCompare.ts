/**
 * Relaxed output matching after strict harness compare.
 * Accepts alternate correct answers when the testcase is valid but stored indices/order differ.
 */

import {
  coalesceSpuriousSingleElementWrapper,
  normalizeHarnessActualString,
} from "./judgeValueNormalize.js";
import type { JudgeCasePayload } from "./writeJudgeWorkspace.js";

export type RelaxableJudgeCase = {
  index: number;
  passed: boolean;
  actual?: string;
  error?: string;
};

function parseJson(raw: string): unknown | undefined {
  const t = raw.trim();
  if (t.length === 0) return undefined;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return undefined;
  }
}

function parseArgs(inputJson: string): unknown[] | null {
  const root = parseJson(inputJson);
  if (root === null || typeof root !== "object" || Array.isArray(root)) return null;
  const args = (root as { args?: unknown }).args;
  return Array.isArray(args) ? args : null;
}

function toNumberArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const x of v) {
    if (typeof x !== "number" || !Number.isFinite(x)) return null;
    out.push(x);
  }
  return out;
}

function isIntPair(v: unknown): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  );
}

function sortedPairKey(pair: [number, number]): string {
  const a = pair[0];
  const b = pair[1];
  return a <= b ? `${a},${b}` : `${b},${a}`;
}

function isNumberMatrix(v: unknown): v is number[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((row) => Array.isArray(row) && row.every((x) => typeof x === "number" && Number.isFinite(x)))
  );
}

function multisetRowsKey(matrix: number[][]): string {
  const keys = matrix.map((row) => JSON.stringify([...row].sort((a, b) => a - b)));
  keys.sort();
  return JSON.stringify(keys);
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** nums[i] + nums[j] === target, i !== j, in range. */
function isValidTwoSumIndexPair(nums: number[], target: number, pair: [number, number]): boolean {
  const i = pair[0];
  const j = pair[1];
  if (i === j) return false;
  if (i < 0 || j < 0 || i >= nums.length || j >= nums.length) return false;
  return nums[i]! + nums[j]! === target;
}

function twoSumArgsPattern(args: unknown[]): { nums: number[]; target: number } | null {
  if (args.length !== 2) return null;
  const nums = toNumberArray(args[0]);
  if (nums === null || typeof args[1] !== "number" || !Number.isFinite(args[1])) return null;
  return { nums, target: args[1] };
}

/** Re-serialize harness {@code actual} when a stale Java worker still emitted spurious array wrapping. */
export function normalizeJudgeHarnessResults<T extends RelaxableJudgeCase>(
  results: T[],
  cases: JudgeCasePayload[],
): T[] {
  return results.map((r) => {
    const tc = cases[r.index];
    if (tc === undefined || r.actual === undefined || r.actual.trim() === "") return r;
    const normalized = normalizeHarnessActualString(r.actual, tc.expected);
    if (normalized === r.actual) return r;
    const inputJson =
      typeof (r as { inputPreview?: string }).inputPreview === "string"
        ? (r as { inputPreview?: string }).inputPreview!
        : tc.input;
    const passed =
      r.passed ||
      deepEqualJson(parseJson(normalized), parseJson(tc.expected)) ||
      outputsMatch(inputJson, tc.expected, normalized);
    return { ...r, actual: normalized, passed };
  });
}

/**
 * True when `actual` is an acceptable answer for this testcase (strict match already failed).
 */
export function outputsMatch(inputJson: string, expectedRaw: string, actualRaw: string): boolean {
  const expected = parseJson(expectedRaw);
  let actual = parseJson(actualRaw);
  if (expected === undefined || actual === undefined) {
    return expectedRaw.trim() === actualRaw.trim();
  }
  actual = coalesceSpuriousSingleElementWrapper(actual, expected);
  if (deepEqualJson(actual, expected)) {
    return true;
  }

  // [i, j] vs [j, i] (index pairs or unordered pair of values).
  if (isIntPair(actual) && isIntPair(expected)) {
    if (sortedPairKey(actual) === sortedPairKey(expected)) {
      return true;
    }

    const args = parseArgs(inputJson);
    if (args !== null) {
      const pattern = twoSumArgsPattern(args);
      if (pattern !== null) {
        const expOk = isValidTwoSumIndexPair(pattern.nums, pattern.target, expected);
        const actOk = isValidTwoSumIndexPair(pattern.nums, pattern.target, actual);
        if (expOk && actOk) {
          return true;
        }
      }
    }
  }

  // Combination-style answers: [[a,b],[c]] — row order and within-row order may vary.
  if (isNumberMatrix(actual) && isNumberMatrix(expected)) {
    if (multisetRowsKey(actual) === multisetRowsKey(expected)) {
      return true;
    }
  }

  return false;
}

/** Re-evaluate failed cases with relaxed rules (harness already did strict compare). */
export function relaxJudgeTestResults<T extends RelaxableJudgeCase>(
  results: T[],
  cases: JudgeCasePayload[],
): T[] {
  return results.map((r) => {
    if (r.passed) return r;
    if (r.error !== undefined && r.error.trim() !== "") return r;
    const tc = cases[r.index];
    if (tc === undefined) return r;
    const actual = r.actual;
    if (actual === undefined || actual.trim() === "") return r;
    if (/^\[[A-Z][A-Za-z0-9]*@[0-9a-fA-F]+\]$/.test(actual.trim())) {
      return r;
    }
    const inputJson =
      tc.input ||
      (typeof (r as { inputPreview?: string }).inputPreview === "string"
        ? (r as { inputPreview?: string }).inputPreview!
        : "");
    if (inputJson.length === 0) return r;
    if (outputsMatch(inputJson, tc.expected, actual)) {
      return { ...r, passed: true };
    }
    return r;
  });
}
