# Judge timing model

CodeZero reports **phase-separated** timings on every judge submission. This document explains what each field means and why our numbers differ from LeetCode-style “0 ms” displays.

## Response fields

| Field | Meaning |
|-------|---------|
| `queueTimeMs` | Time from DB row creation (enqueue) until the worker starts processing. Includes Redis/BullMQ wait and worker concurrency backlog. |
| `compileTimeMs` | Compiler inside the sandbox only (`g++`, `javac`). `0` for interpreted languages. |
| `executionTimeMs` | **User solution only** — max per-testcase time measured inside the language harness (`perf_counter`, `performance.now`, `nanoTime`, `chrono`). |
| `runtimeMs` | Same as `executionTimeMs` (kept for backward compatibility). |
| `sandboxWallMs` | Full `docker run` wall clock: compile + all testcases + container script overhead. |
| `totalTimeMs` | End-to-end from submit (`createdAt`) until the worker finishes and persists the result. |

### What is *not* included in `executionTimeMs`

- Docker image pull / container create
- Queue wait (`queueTimeMs`)
- Workspace file writes on the worker host
- Compilation (`compileTimeMs`)
- Harness JSON parsing, DB updates, network poll latency

## How we measure

1. **Compile** — `run.sh` records `compile_ms.txt` using a shell clock (`python3` or GNU `date`) around `g++` / `javac`.
2. **Execution** — Each harness times only the call into the user’s `Solution` method and sets `executionTimeMs` to the **maximum** testcase time (LeetCode-style “official” runtime).
3. **Queue / total** — Measured on the Node worker with `Date.now()` at pickup and finalize.

Structured logs: `judge worker picked job`, `judge sandbox phases`, `judge timing breakdown`.

## Why LeetCode often shows lower numbers

LeetCode’s public “0 ms” / “1 ms” is **not** raw wall-clock on a cold Docker sandbox:

| Factor | Typical impact |
|--------|----------------|
| **Pre-warmed runtimes** | Long-lived workers, reused JVMs/CPUs — we start a fresh container per submission (`docker run --rm`). |
| **Dedicated judge fleet** | Co-located, tuned hosts — we run on your worker + Docker overhead. |
| **Reported metric** | Often aggregated / normalized / best-of — we report measured harness max ms. |
| **Security isolation** | `--network none`, read-only root, memory/CPU caps — adds latency, prevents cheating. |
| **Distributed queue** | API → Redis → worker — visible as `queueTimeMs` under load. |
| **Full testcase sweep** | We run every case in one process (sequential); no early exit on WA for hidden suites. |

Our architecture prioritizes **correctness and isolation** over minimizing the first digit of runtime.

## Benchmark mode

Run repeated executions to inspect variance (requires DB problem with judge configured):

```bash
npm run judge:benchmark -- <problemSlug> <language> [iterations]
```

Example:

```bash
npm run judge:benchmark -- two-sum python 5
```

Prints per-iteration `queue`, `compile`, `execution`, `sandbox`, and `total` ms plus min/max/avg for execution.

## Tuning (environment)

| Variable | Default | Role |
|----------|---------|------|
| `COMPILER_EXECUTION_TIMEOUT_SEC` | 10 | Per-submission in-container `timeout` |
| `COMPILER_JOB_TIMEOUT_MS` | 30000 | Node-side Docker kill |
| Worker concurrency | 4 | BullMQ parallel jobs |

Reducing queue wait: scale workers, dedicated queue for judge vs playground (future), avoid overloading Redis.

Reducing sandbox wall: container pooling would be a larger change (security review required); not enabled today.
