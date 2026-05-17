/** Fixed harness — loads {@code Solution} from prelude-wrapped submission. */
export const PYTHON_JUDGE_HARNESS = `
import json
import time
import traceback

from submission import Solution

def norm(v):
    return json.loads(json.dumps(v, sort_keys=True))

with open("/workspace/cases.json", "r", encoding="utf8") as f:
    bundle = json.load(f)

fn = bundle["functionName"]
cases = bundle["cases"]

sol = Solution()
method = getattr(sol, fn)

results = []
max_run_ms = 0
for idx, tc in enumerate(cases):
    hidden = tc.get("hidden", False)
    try:
        args_obj = json.loads(tc["input"])
        args = args_obj["args"]
        expected_raw = tc["expected"]
        expected = json.loads(expected_raw)

        t0 = time.perf_counter()
        actual = method(*args)
        run_ms = int((time.perf_counter() - t0) * 1000)
        max_run_ms = max(max_run_ms, run_ms)
        act_n = norm(actual)
        exp_n = norm(expected)
        ok = act_n == exp_n
        results.append(
            {
                "index": idx,
                "passed": ok,
                "runTimeMs": run_ms,
                "actual": json.dumps(actual, separators=(",", ":")),
                "expected": json.dumps(expected, separators=(",", ":")),
                "inputPreview": tc["input"][:200],
                "hidden": hidden,
            }
        )
    except Exception:
        results.append(
            {
                "index": idx,
                "passed": False,
                "error": traceback.format_exc()[:2400],
                "hidden": hidden,
            }
        )

print(
    json.dumps({"results": results, "executionTimeMs": max_run_ms}, separators=(",", ":")),
    end="",
)
`.trimStart();
