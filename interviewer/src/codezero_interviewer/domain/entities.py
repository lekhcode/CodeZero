from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from codezero_interviewer.domain.enums import AgentUiState, InterviewMode, InterviewState


@dataclass(frozen=True, slots=True)
class TurnId:
    value: str = field(default_factory=lambda: str(uuid4()))

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True, slots=True)
class ProblemContext:
    """Immutable problem blob for a session."""

    slug: str
    title: str
    difficulty: str
    statement: str
    constraints: str
    examples: list[dict[str, Any]] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    language: str | None = None


@dataclass(slots=True)
class ConversationTurn:
    role: str  # "candidate" | "interviewer" | "system"
    content: str
    turn_id: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class CodeSnapshot:
    version: int
    language: str
    code: str
    diff_summary: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class ExecutionSummary:
    status: str
    mode: str
    passed: int | None = None
    failed: int | None = None
    stderr: str | None = None
    notes: str | None = None


@dataclass(slots=True)
class InterviewSession:
    session_id: str
    problem: ProblemContext
    mode: InterviewMode = InterviewMode.STANDARD
    state: InterviewState = InterviewState.QUESTION_OPEN
    ui_state: AgentUiState = AgentUiState.IDLE
    active_turn_id: TurnId | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
