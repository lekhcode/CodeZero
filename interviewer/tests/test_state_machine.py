from __future__ import annotations

import pytest

from codezero_interviewer.application.state_machine import (
    InterviewStateMachine,
    InvalidTransitionError,
)
from codezero_interviewer.domain.enums import InterviewState


def test_happy_path_to_coding() -> None:
    sm = InterviewStateMachine()
    assert sm.state == InterviewState.QUESTION_OPEN
    sm.transition(InterviewState.DISCOVERY)
    sm.transition(InterviewState.APPROACH_REVIEW)
    sm.transition(InterviewState.CODING)
    assert sm.state == InterviewState.CODING


def test_failed_tests_return_to_coding() -> None:
    sm = InterviewStateMachine(InterviewState.CODING)
    sm.transition(InterviewState.TESTING)
    sm.transition(InterviewState.CODING)
    assert sm.state == InterviewState.CODING


def test_illegal_jump_raises() -> None:
    sm = InterviewStateMachine(InterviewState.QUESTION_OPEN)
    with pytest.raises(InvalidTransitionError):
        sm.transition(InterviewState.FEEDBACK)


def test_pause_and_resume() -> None:
    sm = InterviewStateMachine(InterviewState.APPROACH_REVIEW)
    sm.transition(InterviewState.PAUSED)
    assert sm.resume() == InterviewState.APPROACH_REVIEW
