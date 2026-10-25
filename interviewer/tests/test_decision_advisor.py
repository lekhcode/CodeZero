from __future__ import annotations

from codezero_interviewer.application.context_store import SessionContext
from codezero_interviewer.application.decision_advisor import DecisionAdvisor
from codezero_interviewer.domain.actions import DecisionKind, InterviewerDecision
from codezero_interviewer.domain.entities import ProblemContext
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType


def _ctx(**kwargs) -> SessionContext:
    problem = ProblemContext(
        slug="two-sum",
        title="Two Sum",
        difficulty="EASY",
        statement="Find two indices that sum to target.",
        constraints="1 <= n <= 1e4",
        topics=["Array", "Hash Table"],
    )
    return SessionContext(problem=problem, **kwargs)


def test_opening_varies_with_topics() -> None:
    advisor = DecisionAdvisor()
    plan = advisor.plan_opening(_ctx(), InterviewMode.STANDARD)
    assert "Two Sum" in plan.suggested_utterance
    assert "?" in plan.suggested_utterance


def test_learning_opening_asks_for_io() -> None:
    advisor = DecisionAdvisor()
    plan = advisor.plan_opening(_ctx(), InterviewMode.LEARNING)
    low = plan.suggested_utterance.lower()
    assert "two sum" in low
    assert "?" in plan.suggested_utterance
    assert any(k in low for k in ("input", "teammate", "correct answer", "return"))
    assert "great answer" not in low


def test_exec_failure_is_evidence_based() -> None:
    advisor = DecisionAdvisor()
    ctx = _ctx()
    event = InterviewEvent(
        type=InterviewEventType.EXECUTION_FAILED,
        session_id="s",
        payload={"status": "WRONG_ANSWER", "notes": "case 3"},
    )
    decision = advisor.prefer_deterministic(
        event=event,
        ctx=ctx,
        state=InterviewState.TESTING,
        mode=InterviewMode.STANDARD,
    )
    assert decision is not None
    assert decision.decision == DecisionKind.DISCUSS_ISSUE
    assert "WRONG_ANSWER" in decision.utterance
    assert "great" not in decision.utterance.lower()


def test_refine_blocks_false_incorrect() -> None:
    advisor = DecisionAdvisor()
    ctx = _ctx()
    event = InterviewEvent(
        type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
        session_id="s",
        payload={"text": "done"},
    )
    decision = InterviewerDecision(
        decision=DecisionKind.SPEAK,
        speak=True,
        utterance="Your solution is incorrect.",
    )
    refined = advisor.refine(
        decision,
        ctx=ctx,
        state=InterviewState.CODING,
        mode=InterviewMode.STANDARD,
        event=event,
    )
    assert "incorrect" not in refined.utterance.lower() or "without a failing" in refined.utterance.lower()


def test_ingest_extracts_approach_claim() -> None:
    advisor = DecisionAdvisor()
    ctx = _ctx()
    advisor.ingest_candidate_text(ctx, "I will use a hash map for O(n) time.")
    assert ctx.chosen_approach
    assert "complexity" in ctx.topics_explored or "approach" in ctx.topics_explored
