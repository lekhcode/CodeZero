from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4


class InterviewEventType(str, Enum):
    PROBLEM_OPENED = "problem.opened"
    INTERVIEW_STARTED = "interview.started"
    CANDIDATE_SPEECH_STARTED = "candidate.speech.started"
    CANDIDATE_TRANSCRIPT_PARTIAL = "candidate.transcript.partial"
    CANDIDATE_TURN_FINALIZED = "candidate.turn.finalized"
    EDITOR_CHANGED = "editor.changed"
    CODE_SNAPSHOT_CREATED = "code.snapshot.created"
    CODE_ANALYSIS_COMPLETED = "code.analysis.completed"
    EXECUTION_STARTED = "execution.started"
    EXECUTION_COMPLETED = "execution.completed"
    EXECUTION_FAILED = "execution.failed"
    CANDIDATE_REQUESTED_HINT = "candidate.requested_hint"
    CANDIDATE_INTERRUPTED = "candidate.interrupted"
    INTERVIEWER_RESPONSE_CANCELLED = "interviewer.response.cancelled"
    INTERVIEWER_TURN_COMPLETED = "interviewer.turn.completed"
    INTERVIEW_COMPLETED = "interview.completed"
    PHASE_ADVANCE_REQUESTED = "phase.advance.requested"


@dataclass(frozen=True, slots=True)
class InterviewEvent:
    type: InterviewEventType
    session_id: str
    payload: dict[str, Any] = field(default_factory=dict)
    event_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
