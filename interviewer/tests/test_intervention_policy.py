from __future__ import annotations

from datetime import datetime, timedelta, timezone

from codezero_interviewer.application.intervention_policy import InterventionPolicy
from codezero_interviewer.domain.actions import DecisionKind, InterviewerDecision
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType


def test_strict_mode_blocks_editor_llm() -> None:
    policy = InterventionPolicy(mode=InterviewMode.STRICT)
    event = InterviewEvent(
        type=InterviewEventType.EDITOR_CHANGED,
        session_id="s1",
        payload={},
    )
    assert policy.should_invoke_llm(event, InterviewState.CODING) is False


def test_standard_allows_candidate_turn() -> None:
    policy = InterventionPolicy(mode=InterviewMode.STANDARD)
    event = InterviewEvent(
        type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
        session_id="s1",
        payload={"text": "brute force first"},
    )
    assert policy.should_invoke_llm(event, InterviewState.DISCOVERY) is True


def test_strict_converts_hint_to_explanation() -> None:
    policy = InterventionPolicy(mode=InterviewMode.STRICT)
    decision = InterviewerDecision(
        decision=DecisionKind.OFFER_HINT,
        speak=True,
        utterance="Try a hash map.",
    )
    filtered = policy.filter_decision(decision, state=InterviewState.APPROACH_REVIEW)
    assert filtered.decision == DecisionKind.REQUEST_EXPLANATION


def test_coding_cooldown_suppresses() -> None:
    policy = InterventionPolicy(mode=InterviewMode.STANDARD, min_gap_seconds=30)
    now = datetime.now(timezone.utc)
    first = InterviewerDecision(
        decision=DecisionKind.SPEAK,
        speak=True,
        utterance="Why this loop?",
    )
    policy.filter_decision(first, state=InterviewState.CODING, now=now)
    second = InterviewerDecision(
        decision=DecisionKind.SPEAK,
        speak=True,
        utterance="Again?",
    )
    filtered = policy.filter_decision(
        second,
        state=InterviewState.CODING,
        now=now + timedelta(seconds=1),
    )
    assert filtered.decision == DecisionKind.REMAIN_SILENT
