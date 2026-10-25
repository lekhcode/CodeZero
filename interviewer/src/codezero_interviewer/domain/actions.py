from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class DecisionKind(str, Enum):
    REMAIN_SILENT = "remain_silent"
    ASK_CLARIFYING = "ask_clarifying"
    CHALLENGE_ASSUMPTION = "challenge_assumption"
    REQUEST_EXPLANATION = "request_explanation"
    OFFER_HINT = "offer_hint"
    DISCUSS_ISSUE = "discuss_issue"
    ADVANCE_PHASE = "advance_phase"
    CANCEL_OR_DEFER = "cancel_or_defer"
    SPEAK = "speak"


class InterviewerDecision(BaseModel):
    """Structured model output — validated; invalid payloads get a safe fallback."""

    decision: DecisionKind = DecisionKind.SPEAK
    speak: bool = True
    utterance: str = Field(
        default="",
        description="Short spoken interviewer line. Empty if silent.",
    )
    advance_to: (
        Literal[
            "DISCOVERY",
            "APPROACH_REVIEW",
            "CODING",
            "TESTING",
            "REVIEW",
            "TRADEOFFS",
            "FEEDBACK",
        ]
        | None
    ) = None
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    rationale: str = ""
    reveal_solution: bool = False
    tone: (
        Literal[
            "neutral",
            "encouraging",
            "curious",
            "probing",
            "reassuring",
            "wrapping_up",
        ]
        | None
    ) = "neutral"
    callback_ref: str | None = Field(
        default=None,
        description="Which callback_memory detail this turn referenced, if any.",
    )

    def safe_utterance(self) -> str:
        text = (self.utterance or "").strip()
        if self.reveal_solution:
            return (
                "I won't give a full solution here. "
                "Walk me through your next step instead."
            )
        return text
