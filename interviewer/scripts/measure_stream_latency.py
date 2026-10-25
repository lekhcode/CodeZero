"""Measure end-to-end stream latency against a local interviewer runtime.

Usage (from interviewer/ with serve + Ollama up):
  .venv/Scripts/python scripts/measure_stream_latency.py --runs 3
"""

from __future__ import annotations

import argparse
import json
import statistics
import time
import uuid
from typing import Any

import httpx


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = min(len(ordered) - 1, max(0, int(round((p / 100) * (len(ordered) - 1)))))
    return ordered[idx]


def one_run(client: httpx.Client, base: str) -> dict[str, float]:
    sid = str(uuid.uuid4())
    client.post(
        f"{base}/sessions",
        json={
            "session_id": sid,
            "mode": "standard",
            "problem": {
                "slug": "two-sum",
                "title": "Two Sum",
                "difficulty": "Easy",
                "statement": "Given an array of integers nums and an integer target, "
                "return indices of the two numbers such that they add up to target.",
                "constraints": "2 <= nums.length <= 10^4",
                "examples": [],
                "topics": ["Array", "Hash Table"],
            },
        },
    ).raise_for_status()

    t0 = time.perf_counter()
    first_chunk_s: float | None = None
    final: dict[str, Any] | None = None

    with client.stream(
        "POST",
        f"{base}/sessions/{sid}/events/stream",
        json={"type": "interview.started", "payload": {}},
        timeout=180.0,
    ) as resp:
        resp.raise_for_status()
        buf = ""
        for chunk in resp.iter_text():
            buf += chunk
            while "\n\n" in buf:
                block, buf = buf.split("\n\n", 1)
                data_lines = [
                    line[5:].lstrip()
                    for line in block.split("\n")
                    if line.startswith("data:")
                ]
                if not data_lines:
                    continue
                item = json.loads("\n".join(data_lines))
                kind = item.get("type")
                if kind == "speak_chunk" and first_chunk_s is None:
                    first_chunk_s = time.perf_counter() - t0
                if kind == "final" or "utterance" in item:
                    final = item

    total_s = time.perf_counter() - t0
    latency = (final or {}).get("latency") or {}
    return {
        "first_speak_chunk_s": first_chunk_s or total_s,
        "full_response_s": total_s,
        "llm_ttft_ms": float(latency.get("llm_ttft_ms") or 0),
        "first_speakable_ms": float(latency.get("first_speakable_ms") or 0),
        "orchestration_ms": float(latency.get("orchestration_ms") or 0),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8100")
    parser.add_argument("--runs", type=int, default=3)
    args = parser.parse_args()

    rows: list[dict[str, float]] = []
    with httpx.Client() as client:
        for i in range(args.runs):
            row = one_run(client, args.base.rstrip("/"))
            rows.append(row)
            print(f"run {i + 1}: {json.dumps(row)}")

    for key in rows[0]:
        vals = [r[key] for r in rows]
        print(
            f"{key}: p50={percentile(vals, 50):.3f} p95={percentile(vals, 95):.3f} "
            f"mean={statistics.mean(vals):.3f}"
        )


if __name__ == "__main__":
    main()
