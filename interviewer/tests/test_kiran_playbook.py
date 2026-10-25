from __future__ import annotations

from codezero_interviewer.application.context_assembler import (
    SYSTEM_PROMPT_TEMPLATE,
    ContextAssembler,
    render_system_prompt,
)
from codezero_interviewer.application.context_store import SessionContext
from codezero_interviewer.application.decision_advisor import DecisionAdvisor
from codezero_interviewer.domain.entities import ProblemContext
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType


def _ctx() -> SessionContext:
    return SessionContext(
        problem=ProblemContext(
            slug="two-sum",
            title="Two Sum",
            difficulty="EASY",
            statement="Find two indices.",
            constraints="n <= 1e4",
            topics=["Array", "Hash Table"],
        ),
        candidate_first_name="Riya",
    )


def test_system_prompt_is_kiran_playbook() -> None:
    assert 'You are "Kiran"' in SYSTEM_PROMPT_TEMPLATE
    assert "<persona_traits>" in SYSTEM_PROMPT_TEMPLATE
    assert "<quirks>" in SYSTEM_PROMPT_TEMPLATE
    assert "callback_ref" in SYSTEM_PROMPT_TEMPLATE
    assert "Take your time." in SYSTEM_PROMPT_TEMPLATE
    assert "trips up a lot of people" in SYSTEM_PROMPT_TEMPLATE
    assert "Let's delve" in SYSTEM_PROMPT_TEMPLATE
    assert "8) Wrap-up" in SYSTEM_PROMPT_TEMPLATE


def test_render_system_prompt_fills_candidate_name() -> None:
    text = render_system_prompt("Riya Sharma")
    assert "Candidate name: Riya." in text
    assert "Hi Riya, welcome!" in text
    assert "{candidate_name}" not in text


def test_render_system_prompt_unknown_name() -> None:
    text = render_system_prompt(None)
    assert "Candidate name: there." in text


def test_callback_memory_from_candidate_speech() -> None:
    advisor = DecisionAdvisor()
    ctx = _ctx()
    advisor.ingest_candidate_text(
        ctx, "I'll start with brute force then switch to a hash map for duplicates."
    )
    assert any("brute force" in c for c in ctx.callback_memory)
    assert any("duplicate" in c for c in ctx.callback_memory)


def test_context_blob_includes_callback_and_name() -> None:
    ctx = _ctx()
    ctx.callback_memory = ["mentioned duplicates"]
    msgs = ContextAssembler().build(
        ctx=ctx,
        state=InterviewState.TESTING,
        mode=InterviewMode.STANDARD,
        event=InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id="s",
            payload={"text": "done"},
        ),
    )
    system = msgs[0].content
    user = msgs[1].content
    assert "Candidate name: Riya." in system
    assert "Riya" in user
    assert "mentioned duplicates" in user
    assert "playbook_stage" in user
