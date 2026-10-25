"""Monotonic latency spans for interviewer pipeline observability."""

from __future__ import annotations

import time
from dataclasses import dataclass, field


@dataclass
class LatencyTrace:
    turn_id: str
    marks: dict[str, float] = field(default_factory=dict)

    def mark(self, name: str) -> None:
        self.marks[name] = time.perf_counter()

    def ms_between(self, start: str, end: str) -> float | None:
        if start not in self.marks or end not in self.marks:
            return None
        return round((self.marks[end] - self.marks[start]) * 1000.0, 1)

    def summary(self) -> dict[str, float | None]:
        return {
            "llm_ttft_ms": self.ms_between("llm_request_started", "first_llm_token"),
            "first_speakable_ms": self.ms_between(
                "llm_request_started", "first_speakable_chunk"
            ),
            "llm_complete_ms": self.ms_between("llm_request_started", "llm_complete"),
            "orchestration_ms": self.ms_between("orchestration_started", "llm_request_started"),
        }
