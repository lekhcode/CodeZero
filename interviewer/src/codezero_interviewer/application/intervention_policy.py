from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from codezero_interviewer.domain.actions import DecisionKind, InterviewerDecision
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType


@dataclass
class PolicyState:
    last_intervention_at: datetime | None = None
    interventions_in_window: int = 0
    candidate_speaking: bool = False


class InterventionPolicy:
    """
    Deterministic gate in front of the LLM suggestion.
    Strategy pattern: mode changes thresholds without touching the orchestrator core.
    """

    def __init__(
        self,
        mode: InterviewMode = InterviewMode.STANDARD,
        *,
        min_gap_seconds: float | None = None,
        max_interventions_per_minute: int | None = None,
    ) -> None:
        self.mode = mode
        # Mode-tuned defaults: strict stays quieter; learning may prompt more.
        if min_gap_seconds is None:
            min_gap_seconds = {
                InterviewMode.STRICT: 20.0,
                InterviewMode.STANDARD: 12.0,
                InterviewMode.LEARNING: 8.0,
            }.get(mode, 12.0)
        if max_interventions_per_minute is None:
            max_interventions_per_minute = {
                InterviewMode.STRICT: 2,
                InterviewMode.STANDARD: 4,
                InterviewMode.LEARNING: 6,
            }.get(mode, 4)
        self.min_gap = timedelta(seconds=min_gap_seconds)
        self.max_per_minute = max_interventions_per_minute
        self._state = PolicyState()

    def on_event(self, event: InterviewEvent) -> None:
        if event.type == InterviewEventType.CANDIDATE_SPEECH_STARTED:
            self._state.candidate_speaking = True
        elif event.type in {
            InterviewEventType.CANDIDATE_TURN_FINALIZED,
            InterviewEventType.CANDIDATE_INTERRUPTED,
        }:
            self._state.candidate_speaking = False

    def should_invoke_llm(self, event: InterviewEvent, state: InterviewState) -> bool:
        if state in {InterviewState.PAUSED, InterviewState.TERMINATED}:
            return False
        if self._state.candidate_speaking and event.type == InterviewEventType.EDITOR_CHANGED:
            return False

        always = {
            InterviewEventType.INTERVIEW_STARTED,
            InterviewEventType.CANDIDATE_TURN_FINALIZED,
            InterviewEventType.CANDIDATE_REQUESTED_HINT,
            InterviewEventType.EXECUTION_COMPLETED,
            InterviewEventType.EXECUTION_FAILED,
            InterviewEventType.PHASE_ADVANCE_REQUESTED,
        }
        if event.type in always:
            return True

        if event.type == InterviewEventType.EDITOR_CHANGED:
            if state != InterviewState.CODING:
                return False
            if self.mode == InterviewMode.STRICT:
                return False
            return self._cooldown_ok()

        if event.type == InterviewEventType.CODE_SNAPSHOT_CREATED:
            return state == InterviewState.CODING and self.mode != InterviewMode.STRICT

        return False

    def filter_decision(
        self,
        decision: InterviewerDecision,
        *,
        state: InterviewState,
        now: datetime | None = None,
    ) -> InterviewerDecision:
        now = now or datetime.now(timezone.utc)

        if decision.reveal_solution and self.mode != InterviewMode.LEARNING:
            decision = decision.model_copy(
                update={
                    "reveal_solution": False,
                    "utterance": decision.safe_utterance(),
                    "decision": DecisionKind.REQUEST_EXPLANATION,
                }
            )

        if decision.decision == DecisionKind.OFFER_HINT and self.mode == InterviewMode.STRICT:
            decision = decision.model_copy(
                update={
                    "decision": DecisionKind.REQUEST_EXPLANATION,
                    "utterance": (
                        decision.utterance
                        or "What would you try next without looking up a solution?"
                    ),
                }
            )

        if decision.speak and decision.utterance.strip():
            if not self._cooldown_ok(now=now) and state == InterviewState.CODING:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="suppressed_by_cooldown",
                )
            self._record_intervention(now)

        return decision

    def _cooldown_ok(self, now: datetime | None = None) -> bool:
        now = now or datetime.now(timezone.utc)
        if self._state.last_intervention_at is None:
            return True
        if now - self._state.last_intervention_at < self.min_gap:
            return False
        return self._state.interventions_in_window < self.max_per_minute

    def _record_intervention(self, now: datetime) -> None:
        if (
            self._state.last_intervention_at
            and now - self._state.last_intervention_at > timedelta(minutes=1)
        ):
            self._state.interventions_in_window = 0
        self._state.last_intervention_at = now
        self._state.interventions_in_window += 1
