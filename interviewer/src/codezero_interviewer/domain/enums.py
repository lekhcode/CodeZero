from __future__ import annotations

from enum import Enum


class InterviewState(str, Enum):
    QUESTION_OPEN = "QUESTION_OPEN"
    DISCOVERY = "DISCOVERY"
    APPROACH_REVIEW = "APPROACH_REVIEW"
    CODING = "CODING"
    TESTING = "TESTING"
    REVIEW = "REVIEW"
    TRADEOFFS = "TRADEOFFS"
    FEEDBACK = "FEEDBACK"
    PAUSED = "PAUSED"
    TERMINATED = "TERMINATED"


class InterviewMode(str, Enum):
    STRICT = "strict"
    STANDARD = "standard"
    LEARNING = "learning"


class AgentUiState(str, Enum):
    """Tiny UI strip states — deterministic, not LLM-controlled."""

    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"
    ANALYZING = "analyzing"
