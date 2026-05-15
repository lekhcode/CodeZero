/** Fixed harness — loads {@code Solution} from prelude-wrapped submission. */
export const PYTHON_JUDGE_HARNESS = `
import json
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
for idx, tc in enumerate(cases):
    hidden = tc.get("hidden", False)
    try:
        args_obj = json.loads(tc["input"])
        args = args_obj["args"]
        expected_raw = tc["expected"]
        expected = json.loads(expected_raw)

        actual = method(*args)
        act_n = norm(actual)
        exp_n = norm(expected)
        ok = act_n == exp_n
        results.append(
            {
                "index": idx,
                "passed": ok,
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

print(json.dumps({"results": results}, separators=(",", ":")), end="")
`.trimStart();
