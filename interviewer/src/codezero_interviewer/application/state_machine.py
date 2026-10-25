from __future__ import annotations

from codezero_interviewer.domain.enums import InterviewState


class InvalidTransitionError(ValueError):
    pass


# Explicit allowed edges — LLM cannot invent phases.
_ALLOWED: dict[InterviewState, frozenset[InterviewState]] = {
    InterviewState.QUESTION_OPEN: frozenset(
        {InterviewState.DISCOVERY, InterviewState.PAUSED, InterviewState.TERMINATED}
    ),
    InterviewState.DISCOVERY: frozenset(
        {
            InterviewState.APPROACH_REVIEW,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.APPROACH_REVIEW: frozenset(
        {
            InterviewState.CODING,
            InterviewState.DISCOVERY,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.CODING: frozenset(
        {
            InterviewState.TESTING,
            InterviewState.APPROACH_REVIEW,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.TESTING: frozenset(
        {
            InterviewState.CODING,
            InterviewState.REVIEW,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.REVIEW: frozenset(
        {
            InterviewState.TRADEOFFS,
            InterviewState.CODING,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.TRADEOFFS: frozenset(
        {
            InterviewState.FEEDBACK,
            InterviewState.REVIEW,
            InterviewState.PAUSED,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.FEEDBACK: frozenset({InterviewState.TERMINATED, InterviewState.PAUSED}),
    InterviewState.PAUSED: frozenset(
        {
            InterviewState.QUESTION_OPEN,
            InterviewState.DISCOVERY,
            InterviewState.APPROACH_REVIEW,
            InterviewState.CODING,
            InterviewState.TESTING,
            InterviewState.REVIEW,
            InterviewState.TRADEOFFS,
            InterviewState.FEEDBACK,
            InterviewState.TERMINATED,
        }
    ),
    InterviewState.TERMINATED: frozenset(),
}


class InterviewStateMachine:
    """Deterministic phase control — Strategy/State hybrid without LLM authority."""

    def __init__(self, initial: InterviewState = InterviewState.QUESTION_OPEN) -> None:
        self._state = initial
        self._paused_from: InterviewState | None = None

    @property
    def state(self) -> InterviewState:
        return self._state

    def can_transition(self, target: InterviewState) -> bool:
        return target in _ALLOWED.get(self._state, frozenset())

    def transition(self, target: InterviewState) -> InterviewState:
        if target == self._state:
            return self._state
        if not self.can_transition(target):
            raise InvalidTransitionError(f"Cannot transition {self._state.value} → {target.value}")
        if target == InterviewState.PAUSED and self._state != InterviewState.PAUSED:
            self._paused_from = self._state
        if self._state == InterviewState.PAUSED and target != InterviewState.PAUSED:
            self._paused_from = None
        self._state = target
        return self._state

    def resume(self) -> InterviewState:
        if self._state != InterviewState.PAUSED:
            return self._state
        target = self._paused_from or InterviewState.DISCOVERY
        self._paused_from = None
        self._state = target
        return self._state

    def parse_advance_target(self, name: str | None) -> InterviewState | None:
        if not name:
            return None
        try:
            return InterviewState(name)
        except ValueError:
            return None
