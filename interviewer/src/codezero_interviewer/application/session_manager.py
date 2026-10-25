"""Session lifecycle: create, restore, isolate, persist — SRP for the orchestrator."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from codezero_interviewer.application.context_store import ContextStore, SessionContext
from codezero_interviewer.application.decision_advisor import DecisionAdvisor
from codezero_interviewer.application.intervention_policy import InterventionPolicy
from codezero_interviewer.application.state_machine import InterviewStateMachine
from codezero_interviewer.domain.entities import InterviewSession, ProblemContext, TurnId
from codezero_interviewer.domain.enums import AgentUiState, InterviewMode, InterviewState
from codezero_interviewer.ports.session_store import ISessionStore

logger = logging.getLogger(__name__)


@dataclass
class SessionBundle:
    session: InterviewSession
    machine: InterviewStateMachine
    policy: InterventionPolicy
    context: SessionContext


class SessionManager:
    """
    Owns in-memory session maps + optional durable store.
    New session_id → clean start. Same session_id → restore history when available.
    """

    def __init__(
        self,
        *,
        store: ISessionStore | None = None,
        context_store: ContextStore | None = None,
        advisor: DecisionAdvisor | None = None,
        default_mode: InterviewMode = InterviewMode.STANDARD,
    ) -> None:
        self._store = store
        self._contexts = context_store or ContextStore()
        self._advisor = advisor or DecisionAdvisor()
        self._default_mode = default_mode
        self._sessions: dict[str, InterviewSession] = {}
        self._machines: dict[str, InterviewStateMachine] = {}
        self._policies: dict[str, InterventionPolicy] = {}
        self._code_versions: dict[str, int] = {}
        self._cancelled_turns: set[str] = set()

    @property
    def advisor(self) -> DecisionAdvisor:
        return self._advisor

    @property
    def contexts(self) -> ContextStore:
        return self._contexts

    def open_session(
        self,
        session_id: str,
        problem: ProblemContext,
        *,
        mode: InterviewMode | None = None,
        restore_if_present: bool = False,
        candidate_first_name: str | None = None,
    ) -> InterviewSession:
        mode = mode or self._default_mode

        if restore_if_present and session_id in self._sessions:
            return self._sessions[session_id]

        if restore_if_present and self._store is not None:
            restored = self.try_restore(session_id)
            if restored is not None:
                return restored.session

        # Fresh session — wipe any stale memory for this id.
        self._drop_memory(session_id)
        session = InterviewSession(session_id=session_id, problem=problem, mode=mode)
        self._sessions[session_id] = session
        self._machines[session_id] = InterviewStateMachine(InterviewState.QUESTION_OPEN)
        self._policies[session_id] = InterventionPolicy(mode=mode)
        ctx = self._contexts.create(session_id, problem)
        if candidate_first_name:
            ctx.candidate_first_name = candidate_first_name.strip().split()[0] or None
        self._code_versions[session_id] = 0
        self.persist(session_id)
        return session

    def try_restore(self, session_id: str) -> SessionBundle | None:
        if session_id in self._sessions:
            return self.bundle(session_id)
        if self._store is None:
            return None
        snap = self._store.load(session_id)
        if not snap:
            return None
        try:
            return self._hydrate(session_id, snap)
        except Exception:
            logger.exception("Failed to restore session %s", session_id)
            return None

    def bundle(self, session_id: str) -> SessionBundle:
        return SessionBundle(
            session=self._sessions[session_id],
            machine=self._machines[session_id],
            policy=self._policies[session_id],
            context=self._contexts.get(session_id),
        )

    def get_session(self, session_id: str) -> InterviewSession:
        if session_id in self._sessions:
            return self._sessions[session_id]
        restored = self.try_restore(session_id)
        if restored is None:
            raise KeyError(session_id)
        return restored.session

    def has_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            return True
        if self._store is None:
            return False
        return self._store.load(session_id) is not None

    def close_session(self, session_id: str, *, delete_persisted: bool = False) -> None:
        self._drop_memory(session_id)
        if delete_persisted and self._store is not None:
            self._store.delete(session_id)

    def cancel_active_turn(self, session_id: str) -> str | None:
        session = self._sessions[session_id]
        if session.active_turn_id is None:
            return None
        tid = str(session.active_turn_id)
        self._cancelled_turns.add(tid)
        session.active_turn_id = None
        session.ui_state = AgentUiState.LISTENING
        self.persist(session_id)
        return tid

    def is_turn_cancelled(self, turn_id: str) -> bool:
        return turn_id in self._cancelled_turns

    def next_code_version(self, session_id: str) -> int:
        self._code_versions[session_id] = self._code_versions.get(session_id, 0) + 1
        return self._code_versions[session_id]

    def persist(self, session_id: str) -> None:
        if self._store is None or session_id not in self._sessions:
            return
        try:
            self._store.save(session_id, self.snapshot(session_id))
        except Exception:
            logger.exception("Persist failed for %s", session_id)

    def snapshot(self, session_id: str) -> dict[str, Any]:
        session = self._sessions[session_id]
        machine = self._machines[session_id]
        ctx = self._contexts.get(session_id)
        return {
            "version": 1,
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "session": {
                "session_id": session.session_id,
                "mode": session.mode.value,
                "state": session.state.value,
                "ui_state": session.ui_state.value,
                "active_turn_id": str(session.active_turn_id)
                if session.active_turn_id
                else None,
                "created_at": session.created_at.isoformat(),
                "problem": {
                    "slug": session.problem.slug,
                    "title": session.problem.title,
                    "difficulty": session.problem.difficulty,
                    "statement": session.problem.statement,
                    "constraints": session.problem.constraints,
                    "examples": session.problem.examples,
                    "topics": session.problem.topics,
                    "language": session.problem.language,
                },
            },
            "machine_state": machine.state.value,
            "code_version": self._code_versions.get(session_id, 0),
            "context": ctx.to_dict(),
            "cancelled_turns": list(self._cancelled_turns),
        }

    def public_view(self, session_id: str) -> dict[str, Any]:
        b = self.bundle(session_id)
        ctx = b.context
        return {
            "sessionId": b.session.session_id,
            "state": b.session.state.value,
            "uiState": b.session.ui_state.value,
            "mode": b.session.mode.value,
            "problemSlug": b.session.problem.slug,
            "interviewStarted": ctx.interview_started,
            "askedQuestions": list(ctx.asked_questions[-12:]),
            "topicsExplored": list(ctx.topics_explored[-12:]),
            "outstandingObjectives": list(ctx.outstanding_objectives[-6:]),
            "codeMilestones": list(ctx.code_milestones[-8:]),
            "lastProcessedEventId": ctx.last_processed_event_id,
        }

    def _hydrate(self, session_id: str, snap: dict[str, Any]) -> SessionBundle:
        sraw = snap["session"]
        praw = sraw["problem"]
        problem = ProblemContext(
            slug=str(praw["slug"]),
            title=str(praw["title"]),
            difficulty=str(praw.get("difficulty", "UNKNOWN")),
            statement=str(praw.get("statement", "")),
            constraints=str(praw.get("constraints", "")),
            examples=list(praw.get("examples") or []),
            topics=list(praw.get("topics") or []),
            language=praw.get("language"),
        )
        mode = InterviewMode(sraw.get("mode", InterviewMode.STANDARD.value))
        state = InterviewState(sraw.get("state", InterviewState.QUESTION_OPEN.value))
        ui = AgentUiState(sraw.get("ui_state", AgentUiState.IDLE.value))
        session = InterviewSession(
            session_id=session_id,
            problem=problem,
            mode=mode,
            state=state,
            ui_state=ui,
            active_turn_id=TurnId(sraw["active_turn_id"])
            if sraw.get("active_turn_id")
            else None,
        )
        machine_state = InterviewState(
            snap.get("machine_state", state.value)
        )
        machine = InterviewStateMachine(machine_state)
        policy = InterventionPolicy(mode=mode)
        ctx = SessionContext.from_dict(snap.get("context") or {"problem": praw})
        self._sessions[session_id] = session
        self._machines[session_id] = machine
        self._policies[session_id] = policy
        self._contexts.put(session_id, ctx)
        self._code_versions[session_id] = int(snap.get("code_version") or 0)
        for tid in snap.get("cancelled_turns") or []:
            self._cancelled_turns.add(str(tid))
        return self.bundle(session_id)

    def _drop_memory(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        self._machines.pop(session_id, None)
        self._policies.pop(session_id, None)
        self._contexts.drop(session_id)
        self._code_versions.pop(session_id, None)
