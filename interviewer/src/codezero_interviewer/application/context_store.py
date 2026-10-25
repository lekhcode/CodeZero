from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from codezero_interviewer.domain.entities import (
    CodeSnapshot,
    ConversationTurn,
    ExecutionSummary,
    ProblemContext,
)


@dataclass
class SessionContext:
    """Structured per-session interview memory — bounded, serializable."""

    problem: ProblemContext
    turns: list[ConversationTurn] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)
    chosen_approach: str | None = None
    asked_questions: list[str] = field(default_factory=list)
    answered_topics: list[str] = field(default_factory=list)
    unresolved_clarifications: list[str] = field(default_factory=list)
    unresolved_issues: list[str] = field(default_factory=list)
    candidate_claims: list[str] = field(default_factory=list)
    topics_explored: list[str] = field(default_factory=list)
    code_milestones: list[str] = field(default_factory=list)
    outstanding_objectives: list[str] = field(default_factory=list)
    recent_feedback: list[str] = field(default_factory=list)
    observations: list[str] = field(default_factory=list)
    code_snapshots: list[CodeSnapshot] = field(default_factory=list)
    last_execution: ExecutionSummary | None = None
    summary: str = ""
    interview_started: bool = False
    last_processed_event_id: str | None = None
    processed_client_event_ids: list[str] = field(default_factory=list)
    opening_objective: str | None = None
    used_openers: list[str] = field(default_factory=list)
    recent_acknowledgements: list[str] = field(default_factory=list)
    # 3–5 short notable candidate details for later callback turns.
    callback_memory: list[str] = field(default_factory=list)
    candidate_first_name: str | None = None
    # ISO timestamp of last "Take your time." style coding nudge.
    last_coding_nudge_at: str | None = None

    def add_turn(self, turn: ConversationTurn, *, max_turns: int = 24) -> None:
        self.turns.append(turn)
        if len(self.turns) > max_turns:
            overflow = self.turns[:-max_turns]
            digest = " | ".join(f"{t.role}:{t.content[:80]}" for t in overflow[-4:])
            self.summary = (self.summary + " " + digest).strip()[:2000]
            self.turns = self.turns[-max_turns:]

    def latest_code(self) -> CodeSnapshot | None:
        return self.code_snapshots[-1] if self.code_snapshots else None

    def add_snapshot(self, snapshot: CodeSnapshot, *, max_snapshots: int = 8) -> None:
        self.code_snapshots.append(snapshot)
        if len(self.code_snapshots) > max_snapshots:
            self.code_snapshots = self.code_snapshots[-max_snapshots:]
        milestone = f"v{snapshot.version}:{snapshot.language}:{len(snapshot.code)}c"
        if milestone not in self.code_milestones:
            self.code_milestones.append(milestone)
            self.code_milestones = self.code_milestones[-12:]

    def remember_client_event(self, client_event_id: str | None, *, max_ids: int = 64) -> bool:
        """Return True if this client event was already processed (duplicate)."""
        if not client_event_id:
            return False
        if client_event_id in self.processed_client_event_ids:
            return True
        self.processed_client_event_ids.append(client_event_id)
        if len(self.processed_client_event_ids) > max_ids:
            self.processed_client_event_ids = self.processed_client_event_ids[-max_ids:]
        return False

    def push_unique(self, bucket: list[str], value: str, *, limit: int = 12) -> None:
        v = value.strip()
        if not v:
            return
        if v not in bucket:
            bucket.append(v)
        if len(bucket) > limit:
            del bucket[:-limit]

    def to_dict(self) -> dict[str, Any]:
        return {
            "problem": asdict(self.problem),
            "turns": [
                {
                    "role": t.role,
                    "content": t.content,
                    "turn_id": t.turn_id,
                    "created_at": t.created_at.isoformat(),
                }
                for t in self.turns
            ],
            "assumptions": list(self.assumptions),
            "chosen_approach": self.chosen_approach,
            "asked_questions": list(self.asked_questions),
            "answered_topics": list(self.answered_topics),
            "unresolved_clarifications": list(self.unresolved_clarifications),
            "unresolved_issues": list(self.unresolved_issues),
            "candidate_claims": list(self.candidate_claims),
            "topics_explored": list(self.topics_explored),
            "code_milestones": list(self.code_milestones),
            "outstanding_objectives": list(self.outstanding_objectives),
            "recent_feedback": list(self.recent_feedback),
            "observations": list(self.observations),
            "code_snapshots": [
                {
                    "version": s.version,
                    "language": s.language,
                    "code": s.code,
                    "diff_summary": s.diff_summary,
                    "created_at": s.created_at.isoformat(),
                }
                for s in self.code_snapshots
            ],
            "last_execution": None
            if self.last_execution is None
            else asdict(self.last_execution),
            "summary": self.summary,
            "interview_started": self.interview_started,
            "last_processed_event_id": self.last_processed_event_id,
            "processed_client_event_ids": list(self.processed_client_event_ids),
            "opening_objective": self.opening_objective,
            "used_openers": list(self.used_openers),
            "recent_acknowledgements": list(self.recent_acknowledgements),
            "callback_memory": list(self.callback_memory),
            "candidate_first_name": self.candidate_first_name,
            "last_coding_nudge_at": self.last_coding_nudge_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SessionContext:
        problem_raw = data["problem"]
        problem = ProblemContext(
            slug=str(problem_raw["slug"]),
            title=str(problem_raw["title"]),
            difficulty=str(problem_raw.get("difficulty", "UNKNOWN")),
            statement=str(problem_raw.get("statement", "")),
            constraints=str(problem_raw.get("constraints", "")),
            examples=list(problem_raw.get("examples") or []),
            topics=list(problem_raw.get("topics") or []),
            language=problem_raw.get("language"),
        )
        turns: list[ConversationTurn] = []
        for t in data.get("turns") or []:
            created = t.get("created_at")
            turns.append(
                ConversationTurn(
                    role=str(t.get("role", "system")),
                    content=str(t.get("content", "")),
                    turn_id=t.get("turn_id"),
                    created_at=_parse_dt(created),
                )
            )
        snaps: list[CodeSnapshot] = []
        for s in data.get("code_snapshots") or []:
            snaps.append(
                CodeSnapshot(
                    version=int(s.get("version", 0)),
                    language=str(s.get("language", "unknown")),
                    code=str(s.get("code", "")),
                    diff_summary=s.get("diff_summary"),
                    created_at=_parse_dt(s.get("created_at")),
                )
            )
        exec_raw = data.get("last_execution")
        last_exec = None
        if isinstance(exec_raw, dict):
            last_exec = ExecutionSummary(
                status=str(exec_raw.get("status", "UNKNOWN")),
                mode=str(exec_raw.get("mode", "")),
                passed=exec_raw.get("passed"),
                failed=exec_raw.get("failed"),
                stderr=exec_raw.get("stderr"),
                notes=exec_raw.get("notes"),
            )
        return cls(
            problem=problem,
            turns=turns,
            assumptions=list(data.get("assumptions") or []),
            chosen_approach=data.get("chosen_approach"),
            asked_questions=list(data.get("asked_questions") or []),
            answered_topics=list(data.get("answered_topics") or []),
            unresolved_clarifications=list(data.get("unresolved_clarifications") or []),
            unresolved_issues=list(data.get("unresolved_issues") or []),
            candidate_claims=list(data.get("candidate_claims") or []),
            topics_explored=list(data.get("topics_explored") or []),
            code_milestones=list(data.get("code_milestones") or []),
            outstanding_objectives=list(data.get("outstanding_objectives") or []),
            recent_feedback=list(data.get("recent_feedback") or []),
            observations=list(data.get("observations") or []),
            code_snapshots=snaps,
            last_execution=last_exec,
            summary=str(data.get("summary") or ""),
            interview_started=bool(data.get("interview_started")),
            last_processed_event_id=data.get("last_processed_event_id"),
            processed_client_event_ids=list(data.get("processed_client_event_ids") or []),
            opening_objective=data.get("opening_objective"),
            used_openers=list(data.get("used_openers") or []),
            recent_acknowledgements=list(data.get("recent_acknowledgements") or []),
            callback_memory=list(data.get("callback_memory") or []),
            candidate_first_name=data.get("candidate_first_name"),
            last_coding_nudge_at=data.get("last_coding_nudge_at"),
        )


def _parse_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


class ContextStore:
    """Versioned per-session context — bounded, not a full transcript dump."""

    def __init__(self) -> None:
        self._by_session: dict[str, SessionContext] = {}

    def create(self, session_id: str, problem: ProblemContext) -> SessionContext:
        ctx = SessionContext(problem=problem)
        self._by_session[session_id] = ctx
        return ctx

    def put(self, session_id: str, ctx: SessionContext) -> SessionContext:
        self._by_session[session_id] = ctx
        return ctx

    def get(self, session_id: str) -> SessionContext:
        try:
            return self._by_session[session_id]
        except KeyError as exc:
            raise KeyError(f"Unknown session context: {session_id}") from exc

    def drop(self, session_id: str) -> None:
        self._by_session.pop(session_id, None)

    def has(self, session_id: str) -> bool:
        return session_id in self._by_session
