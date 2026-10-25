from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from codezero_interviewer.adapters.file_session_store import InMemorySessionStore
from codezero_interviewer.adapters.in_memory_event_bus import InMemoryEventBus
from codezero_interviewer.application.orchestrator import InterviewOrchestrator
from codezero_interviewer.application.session_manager import SessionManager
from codezero_interviewer.domain.entities import ProblemContext
from codezero_interviewer.domain.enums import InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType
from codezero_interviewer.ports.clock import IClock
from codezero_interviewer.ports.llm import ILLMPort, LLMRequest, LLMResponse


class FakeClock(IClock):
    def now(self) -> datetime:
        return datetime(2026, 1, 1, tzinfo=timezone.utc)


class FakeLLM(ILLMPort):
    def __init__(self, payloads: list[dict] | dict) -> None:
        self.payloads = payloads if isinstance(payloads, list) else [payloads]
        self.calls = 0

    async def complete(self, request: LLMRequest) -> LLMResponse:
        payload = self.payloads[min(self.calls, len(self.payloads) - 1)]
        self.calls += 1
        return LLMResponse(text=json.dumps(payload), turn_id=request.turn_id)


@pytest.fixture
def problem() -> ProblemContext:
    return ProblemContext(
        slug="two-sum",
        title="Two Sum",
        difficulty="EASY",
        statement="Return indices of two numbers that add to target.",
        constraints="n >= 2",
        examples=[],
        topics=["Array", "Hash Table"],
    )


def _orch(llm: FakeLLM, store: InMemorySessionStore | None = None) -> InterviewOrchestrator:
    return InterviewOrchestrator(
        llm=llm,
        bus=InMemoryEventBus(),
        clock=FakeClock(),
        session_store=store,
        session_manager=SessionManager(store=store) if store is not None else None,
    )


@pytest.mark.asyncio
async def test_start_and_candidate_turn(problem: ProblemContext) -> None:
    llm = FakeLLM(
        {
            "decision": "ask_clarifying",
            "speak": True,
            "utterance": "What is the expected time complexity you are aiming for?",
            "advance_to": "APPROACH_REVIEW",
            "confidence": 0.8,
            "rationale": "candidate stated approach",
            "reveal_solution": False,
        }
    )
    orch = _orch(llm)
    orch.open_session("s1", problem)

    r1 = await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="s1")
    )
    assert r1 is not None
    assert r1.state == InterviewState.DISCOVERY
    # Phase 2: opening is problem-grounded (no LLM required).
    assert "two sum" in r1.utterance.lower()
    assert llm.calls == 0

    r2 = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id="s1",
            payload={"text": "I would use a hash map for O(n)."},
        )
    )
    assert r2 is not None
    assert r2.utterance
    assert r2.state == InterviewState.APPROACH_REVIEW
    assert llm.calls >= 1


@pytest.mark.asyncio
async def test_duplicate_interview_started_is_idempotent(problem: ProblemContext) -> None:
    llm = FakeLLM({"decision": "speak", "speak": True, "utterance": "x?"})
    orch = _orch(llm)
    orch.open_session("s1", problem)
    first = await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="s1")
    )
    second = await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="s1")
    )
    assert first is not None and first.utterance
    assert second is not None
    assert second.duplicate is True
    assert second.utterance == ""


@pytest.mark.asyncio
async def test_client_event_id_idempotency(problem: ProblemContext) -> None:
    llm = FakeLLM(
        {
            "decision": "speak",
            "speak": True,
            "utterance": "Why a hash map here?",
            "confidence": 0.7,
            "reveal_solution": False,
        }
    )
    orch = _orch(llm)
    orch.open_session("s1", problem)
    await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="s1")
    )
    payload = {"text": "hash map", "client_event_id": "turn-1"}
    a = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id="s1",
            payload=payload,
        )
    )
    b = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id="s1",
            payload=payload,
        )
    )
    assert a is not None and a.utterance
    assert b is not None and b.duplicate is True
    assert llm.calls == 1


@pytest.mark.asyncio
async def test_barge_in_cancels_turn(problem: ProblemContext) -> None:
    llm = FakeLLM(
        {
            "decision": "speak",
            "speak": True,
            "utterance": "Long explanation...",
            "confidence": 0.5,
            "reveal_solution": False,
        }
    )
    orch = _orch(llm)
    orch.open_session("s1", problem)
    await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="s1")
    )
    session = orch.get_session("s1")
    from codezero_interviewer.domain.entities import TurnId

    turn = TurnId()
    session.active_turn_id = turn
    result = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_INTERRUPTED,
            session_id="s1",
            payload={},
        )
    )
    assert result is not None
    assert orch.is_turn_cancelled(str(turn))
    assert session.active_turn_id is None


@pytest.mark.asyncio
async def test_execution_failure_returns_to_coding(problem: ProblemContext) -> None:
    llm = FakeLLM(
        {
            "decision": "discuss_issue",
            "speak": True,
            "utterance": "Which failing case surprises you?",
            "confidence": 0.7,
            "reveal_solution": False,
        }
    )
    orch = _orch(llm)
    orch.open_session("s1", problem)
    machine = orch._machines["s1"]
    machine.transition(InterviewState.DISCOVERY)
    machine.transition(InterviewState.APPROACH_REVIEW)
    machine.transition(InterviewState.CODING)

    result = await orch.handle(
        InterviewEvent(
            type=InterviewEventType.EXECUTION_FAILED,
            session_id="s1",
            payload={"status": "WRONG_ANSWER", "mode": "RUN_SAMPLE", "failed": 1},
        )
    )
    assert result is not None
    assert result.state == InterviewState.CODING
    assert "wrong_answer" in result.utterance.lower() or "breaks" in result.utterance.lower()
    # Grounded exec path — no LLM required.
    assert llm.calls == 0


@pytest.mark.asyncio
async def test_session_persists_and_restores(problem: ProblemContext) -> None:
    store = InMemorySessionStore()
    llm = FakeLLM(
        {
            "decision": "speak",
            "speak": True,
            "utterance": "Complexity of your hash map approach?",
            "advance_to": "APPROACH_REVIEW",
            "confidence": 0.8,
            "reveal_solution": False,
        }
    )
    orch = _orch(llm, store=store)
    orch.open_session("persist-1", problem)
    await orch.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="persist-1")
    )
    await orch.handle(
        InterviewEvent(
            type=InterviewEventType.CANDIDATE_TURN_FINALIZED,
            session_id="persist-1",
            payload={"text": "hash map O(n)"},
        )
    )
    snap = store.load("persist-1")
    assert snap is not None
    assert snap["context"]["interview_started"] is True
    asked = snap["context"]["asked_questions"]
    assert asked

    # Simulate process restart: new orchestrator, same store.
    orch2 = _orch(FakeLLM({"decision": "speak", "speak": True, "utterance": "Next?"}), store=store)
    restored = orch2.restore_session("persist-1")
    assert restored is not None
    view = orch2.session_view("persist-1")
    assert view["interviewStarted"] is True
    assert view["askedQuestions"]
    # Duplicate start must not wipe history.
    again = await orch2.handle(
        InterviewEvent(type=InterviewEventType.INTERVIEW_STARTED, session_id="persist-1")
    )
    assert again is not None
    assert again.duplicate is True
