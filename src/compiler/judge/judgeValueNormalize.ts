/**
 * Structural normalization for harness output values (not string hacks).
 * Repairs the legacy Java bug where {@code List} was serialized as {@code [[elems]]}.
 */

function parseJson(raw: string): unknown | undefined {
  const t = raw.trim();
  if (t.length === 0) return undefined;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return undefined;
  }
}

function isFlatNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x));
}

/**
 * Unwrap {@code [[1,2,3]]} → {@code [1,2,3]} only when expected is a flat 1D number array.
 * Does not alter valid 2D outputs ({@code List<List<Integer>>}, combination sums, etc.).
 */
export function coalesceSpuriousSingleElementWrapper(actual: unknown, expected: unknown): unknown {
  if (!isFlatNumberArray(expected)) return actual;
  if (!Array.isArray(actual) || actual.length !== 1) return actual;
  const inner = actual[0];
  if (!isFlatNumberArray(inner)) return actual;
  return inner;
}

export function normalizeHarnessActualString(actualRaw: string, expectedRaw: string): string {
  const expected = parseJson(expectedRaw);
  const actual = parseJson(actualRaw);
  if (expected === undefined || actual === undefined) return actualRaw;
  const coalesced = coalesceSpuriousSingleElementWrapper(actual, expected);
  if (coalesced === actual) return actualRaw;
  return JSON.stringify(coalesced);
}
