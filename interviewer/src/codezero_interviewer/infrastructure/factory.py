from __future__ import annotations

from codezero_interviewer.adapters.file_session_store import (
    FileSessionStore,
    InMemorySessionStore,
)
from codezero_interviewer.adapters.in_memory_event_bus import InMemoryEventBus
from codezero_interviewer.adapters.ollama_llm import OllamaLLMAdapter
from codezero_interviewer.adapters.system_clock import SystemClock
from codezero_interviewer.application.decision_advisor import DecisionAdvisor
from codezero_interviewer.application.orchestrator import InterviewOrchestrator
from codezero_interviewer.application.question_dedupe import QuestionDeduper
from codezero_interviewer.application.session_manager import SessionManager
from codezero_interviewer.domain.enums import InterviewMode
from codezero_interviewer.infrastructure.config import InterviewerSettings
from codezero_interviewer.ports.session_store import ISessionStore


def build_orchestrator(
    settings: InterviewerSettings | None = None,
    *,
    mode: InterviewMode | None = None,
    session_store: ISessionStore | None = None,
) -> InterviewOrchestrator:
    """Factory: wires concrete adapters without leaking them into domain."""
    settings = settings or InterviewerSettings()
    resolved_mode = mode or _parse_mode(settings.default_mode)

    bus = InMemoryEventBus()
    holder: dict[str, InterviewOrchestrator] = {}

    llm = OllamaLLMAdapter(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
        timeout_s=settings.ollama_timeout_s,
        num_ctx=settings.ollama_num_ctx,
        is_cancelled=lambda turn_id: holder["orch"].is_turn_cancelled(turn_id),
    )

    store = session_store
    if store is None:
        store = (
            FileSessionStore(settings.session_store_dir)
            if settings.session_persist
            else InMemorySessionStore()
        )

    deduper = QuestionDeduper()
    advisor = DecisionAdvisor(deduper=deduper)
    sessions = SessionManager(
        store=store,
        advisor=advisor,
        default_mode=resolved_mode,
    )

    orch = InterviewOrchestrator(
        llm=llm,
        bus=bus,
        clock=SystemClock(),
        mode=resolved_mode,
        session_manager=sessions,
        advisor=advisor,
        deduper=deduper,
    )
    holder["orch"] = orch
    return orch


def _parse_mode(value: str) -> InterviewMode:
    try:
        return InterviewMode(value)
    except ValueError:
        return InterviewMode.STANDARD
