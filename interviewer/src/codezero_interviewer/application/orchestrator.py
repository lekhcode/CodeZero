from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from codezero_interviewer.application.context_assembler import ContextAssembler
from codezero_interviewer.application.context_store import ContextStore, SessionContext
from codezero_interviewer.application.decision_advisor import DecisionAdvisor
from codezero_interviewer.application.latency import LatencyTrace
from codezero_interviewer.application.question_dedupe import QuestionDeduper
from codezero_interviewer.application.session_manager import SessionManager
from codezero_interviewer.application.spoken_style import to_spoken_utterance
from codezero_interviewer.domain.actions import DecisionKind, InterviewerDecision
from codezero_interviewer.domain.entities import (
    CodeSnapshot,
    ConversationTurn,
    ExecutionSummary,
    InterviewSession,
    ProblemContext,
    TurnId,
)
from codezero_interviewer.domain.enums import AgentUiState, InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType
from codezero_interviewer.ports.clock import IClock
from codezero_interviewer.ports.event_bus import IEventBus
from codezero_interviewer.ports.llm import ILLMPort, LLMRequest
from codezero_interviewer.ports.session_store import ISessionStore

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class OrchestratorResult:
    session_id: str
    state: InterviewState
    ui_state: AgentUiState
    turn_id: str | None
    decision: InterviewerDecision
    utterance: str
    latency: dict[str, float | None] = field(default_factory=dict)
    duplicate: bool = False


class InterviewOrchestrator:
    """
    Application service: event in → optional LLM suggestion → policy filter →
    deterministic state updates. LLM never cancels audio or mutates FSM directly.
    """

    def __init__(
        self,
        *,
        llm: ILLMPort,
        bus: IEventBus,
        clock: IClock,
        context_store: ContextStore | None = None,
        assembler: ContextAssembler | None = None,
        mode: InterviewMode = InterviewMode.STANDARD,
        session_store: ISessionStore | None = None,
        session_manager: SessionManager | None = None,
        advisor: DecisionAdvisor | None = None,
        deduper: QuestionDeduper | None = None,
    ) -> None:
        self._llm = llm
        self._bus = bus
        self._clock = clock
        self._assembler = assembler or ContextAssembler()
        self._deduper = deduper or QuestionDeduper()
        self._advisor = advisor or DecisionAdvisor(deduper=self._deduper)
        self._sessions_mgr = session_manager or SessionManager(
            store=session_store,
            context_store=context_store,
            advisor=self._advisor,
            default_mode=mode,
        )
        # Back-compat aliases used by existing tests that poke private maps.
        self._sessions = self._sessions_mgr._sessions  # noqa: SLF001
        self._machines = self._sessions_mgr._machines  # noqa: SLF001
        self._policies = self._sessions_mgr._policies  # noqa: SLF001
        self._contexts = self._sessions_mgr.contexts
        self._cancelled_turns = self._sessions_mgr._cancelled_turns  # noqa: SLF001
        self._code_versions = self._sessions_mgr._code_versions  # noqa: SLF001

    def open_session(
        self,
        session_id: str,
        problem: ProblemContext,
        *,
        mode: InterviewMode | None = None,
        restore_if_present: bool = False,
        candidate_first_name: str | None = None,
    ) -> InterviewSession:
        return self._sessions_mgr.open_session(
            session_id,
            problem,
            mode=mode,
            restore_if_present=restore_if_present,
            candidate_first_name=candidate_first_name,
        )

    def get_session(self, session_id: str) -> InterviewSession:
        return self._sessions_mgr.get_session(session_id)

    def restore_session(self, session_id: str) -> InterviewSession | None:
        bundle = self._sessions_mgr.try_restore(session_id)
        return bundle.session if bundle else None

    def session_view(self, session_id: str) -> dict:
        return self._sessions_mgr.public_view(session_id)

    def cancel_active_turn(self, session_id: str) -> str | None:
        return self._sessions_mgr.cancel_active_turn(session_id)

    def is_turn_cancelled(self, turn_id: str) -> bool:
        return self._sessions_mgr.is_turn_cancelled(turn_id)

    async def handle(self, event: InterviewEvent) -> OrchestratorResult | None:
        bundle = self._sessions_mgr.bundle(event.session_id)
        session, machine, policy, ctx = (
            bundle.session,
            bundle.machine,
            bundle.policy,
            bundle.context,
        )

        dup = self._check_idempotency(event, ctx)
        if dup is not None:
            return dup

        policy.on_event(event)
        self._ingest_side_effects(event, session, machine, ctx)

        if event.type == InterviewEventType.CANDIDATE_INTERRUPTED:
            cancelled = self.cancel_active_turn(event.session_id)
            await self._bus.publish(
                InterviewEvent(
                    type=InterviewEventType.INTERVIEWER_RESPONSE_CANCELLED,
                    session_id=event.session_id,
                    payload={"turn_id": cancelled},
                )
            )
            self._sessions_mgr.persist(event.session_id)
            return OrchestratorResult(
                session_id=event.session_id,
                state=machine.state,
                ui_state=session.ui_state,
                turn_id=cancelled,
                decision=InterviewerDecision(
                    decision=DecisionKind.CANCEL_OR_DEFER,
                    speak=False,
                    utterance="",
                ),
                utterance="",
            )

        # Deterministic grounded decisions (opening / execution / silent coding).
        grounded = self._advisor.prefer_deterministic(
            event=event, ctx=ctx, state=machine.state, mode=session.mode
        )
        if grounded is not None and event.type in {
            InterviewEventType.INTERVIEW_STARTED,
            InterviewEventType.EXECUTION_FAILED,
            InterviewEventType.EXECUTION_COMPLETED,
            InterviewEventType.CODE_SNAPSHOT_CREATED,
        }:
            if event.type == InterviewEventType.CODE_SNAPSHOT_CREATED and not grounded.speak:
                session.ui_state = AgentUiState.IDLE
                ctx.last_processed_event_id = event.event_id
                self._sessions_mgr.persist(event.session_id)
                return OrchestratorResult(
                    session_id=event.session_id,
                    state=machine.state,
                    ui_state=session.ui_state,
                    turn_id=None,
                    decision=grounded,
                    utterance="",
                )
            if event.type != InterviewEventType.CODE_SNAPSHOT_CREATED or grounded.speak:
                turn = TurnId()
                session.active_turn_id = turn
                session.ui_state = AgentUiState.THINKING
                trace = LatencyTrace(turn_id=str(turn))
                trace.mark("orchestration_started")
                trace.mark("llm_request_started")
                trace.mark("llm_complete")
                decision = policy.filter_decision(
                    grounded, state=machine.state, now=self._clock.now()
                )
                decision = self._advisor.refine(
                    decision,
                    ctx=ctx,
                    state=machine.state,
                    mode=session.mode,
                    event=event,
                )
                return await self._finalize_decision(
                    event=event,
                    session=session,
                    machine=machine,
                    policy=policy,
                    ctx=ctx,
                    turn=turn,
                    decision=decision,
                    trace=trace,
                )

        if not policy.should_invoke_llm(event, machine.state):
            session.ui_state = AgentUiState.IDLE
            ctx.last_processed_event_id = event.event_id
            self._sessions_mgr.persist(event.session_id)
            return OrchestratorResult(
                session_id=event.session_id,
                state=machine.state,
                ui_state=session.ui_state,
                turn_id=None,
                decision=InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="policy_skip",
                ),
                utterance="",
            )

        turn = TurnId()
        session.active_turn_id = turn
        session.ui_state = AgentUiState.THINKING
        trace = LatencyTrace(turn_id=str(turn))
        trace.mark("orchestration_started")
        messages = self._assembler.build(
            ctx=ctx, state=machine.state, mode=session.mode, event=event
        )
        trace.mark("llm_request_started")
        llm_resp = await self._llm.complete(
            LLMRequest(messages=messages, turn_id=str(turn))
        )
        trace.mark("llm_complete")

        if self.is_turn_cancelled(str(turn)) or llm_resp.cancelled:
            session.ui_state = AgentUiState.LISTENING
            self._sessions_mgr.persist(event.session_id)
            return None

        decision = self._parse_decision(llm_resp.text)
        decision = policy.filter_decision(decision, state=machine.state, now=self._clock.now())
        decision = self._advisor.refine(
            decision, ctx=ctx, state=machine.state, mode=session.mode, event=event
        )
        return await self._finalize_decision(
            event=event,
            session=session,
            machine=machine,
            policy=policy,
            ctx=ctx,
            turn=turn,
            decision=decision,
            trace=trace,
        )

    async def handle_stream(self, event: InterviewEvent) -> AsyncIterator[dict]:
        """Yield speak_chunk events, then a final result dict (same shape as HTTP JSON)."""
        bundle = self._sessions_mgr.bundle(event.session_id)
        session, machine, policy, ctx = (
            bundle.session,
            bundle.machine,
            bundle.policy,
            bundle.context,
        )

        # Non-streaming paths: delegate to handle() so ingest/idempotency run once.
        if event.type == InterviewEventType.CANDIDATE_INTERRUPTED:
            result = await self.handle(event)
            if result:
                yield {"type": "final", **self._result_payload(result)}
            return

        peek_grounded = self._advisor.prefer_deterministic(
            event=event, ctx=ctx, state=machine.state, mode=session.mode
        )
        if peek_grounded is not None and not peek_grounded.speak:
            result = await self.handle(event)
            if result:
                yield {"type": "final", **self._result_payload(result)}
            return

        if peek_grounded is not None and peek_grounded.speak and event.type in {
            InterviewEventType.INTERVIEW_STARTED,
            InterviewEventType.EXECUTION_FAILED,
            InterviewEventType.EXECUTION_COMPLETED,
        }:
            # Run ingest once, then speak immediately (no LLM wait).
            dup = self._check_idempotency(event, ctx)
            if dup is not None:
                yield {"type": "final", **self._result_payload(dup)}
                return
            policy.on_event(event)
            self._ingest_side_effects(event, session, machine, ctx)
            grounded = self._advisor.prefer_deterministic(
                event=event, ctx=ctx, state=machine.state, mode=session.mode
            ) or peek_grounded
            turn = TurnId()
            session.active_turn_id = turn
            session.ui_state = AgentUiState.THINKING
            trace = LatencyTrace(turn_id=str(turn))
            trace.mark("orchestration_started")
            trace.mark("llm_request_started")
            trace.mark("first_llm_token")
            text = grounded.safe_utterance()
            if text and not self._deduper.is_near_duplicate(text, ctx.asked_questions):
                trace.mark("first_speakable_chunk")
                tone = getattr(grounded, "tone", None) or "encouraging"
                yield {
                    "type": "speak_chunk",
                    "turnId": str(turn),
                    "text": text,
                    "tone": tone,
                }
            trace.mark("llm_complete")
            decision = policy.filter_decision(
                grounded, state=machine.state, now=self._clock.now()
            )
            decision = self._advisor.refine(
                decision, ctx=ctx, state=machine.state, mode=session.mode, event=event
            )
            result = await self._finalize_decision(
                event=event,
                session=session,
                machine=machine,
                policy=policy,
                ctx=ctx,
                turn=turn,
                decision=decision,
                trace=trace,
            )
            if result is None:
                yield {
                    "type": "final",
                    "sessionId": event.session_id,
                    "state": machine.state.value,
                    "uiState": session.ui_state.value,
                    "turnId": str(turn),
                    "utterance": "",
                    "decision": "cancelled",
                    "cancelled": True,
                    "latency": trace.summary(),
                }
                return
            yield {"type": "final", **self._result_payload(result)}
            return

        if not policy.should_invoke_llm(event, machine.state):
            result = await self.handle(event)
            if result:
                yield {"type": "final", **self._result_payload(result)}
            return

        dup = self._check_idempotency(event, ctx)
        if dup is not None:
            yield {"type": "final", **self._result_payload(dup)}
            return

        policy.on_event(event)
        self._ingest_side_effects(event, session, machine, ctx)

        turn = TurnId()
        session.active_turn_id = turn
        session.ui_state = AgentUiState.THINKING
        trace = LatencyTrace(turn_id=str(turn))
        trace.mark("orchestration_started")
        messages = self._assembler.build(
            ctx=ctx, state=machine.state, mode=session.mode, event=event
        )
        from codezero_interviewer.application.utterance_stream import JsonUtteranceExtractor

        extractor = JsonUtteranceExtractor()
        assembled = ""
        first_token = False
        first_speakable = False

        trace.mark("llm_request_started")
        async for delta in self._llm.stream(
            LLMRequest(messages=messages, turn_id=str(turn))
        ):
            if self.is_turn_cancelled(str(turn)):
                session.ui_state = AgentUiState.LISTENING
                self._sessions_mgr.persist(event.session_id)
                yield {
                    "type": "final",
                    "sessionId": event.session_id,
                    "state": machine.state.value,
                    "uiState": session.ui_state.value,
                    "turnId": str(turn),
                    "utterance": "",
                    "decision": "cancelled",
                    "cancelled": True,
                    "latency": trace.summary(),
                }
                return
            if not first_token:
                first_token = True
                trace.mark("first_llm_token")
            assembled += delta
            for sentence in extractor.push(delta):
                if self._deduper.is_near_duplicate(sentence, ctx.asked_questions):
                    continue
                if not first_speakable:
                    first_speakable = True
                    trace.mark("first_speakable_chunk")
                yield {
                    "type": "speak_chunk",
                    "turnId": str(turn),
                    "text": sentence,
                    "tone": extractor.tone,
                }

        for sentence in extractor.flush():
            if not self._deduper.is_near_duplicate(sentence, ctx.asked_questions):
                yield {
                    "type": "speak_chunk",
                    "turnId": str(turn),
                    "text": sentence,
                    "tone": extractor.tone,
                }

        trace.mark("llm_complete")
        raw_text = assembled.strip() or (
            json.dumps(
                {
                    "decision": "speak",
                    "speak": True,
                    "utterance": extractor.full_utterance
                    or "Could you walk me through your understanding of the problem so far?",
                    "confidence": 0.2,
                    "rationale": "stream_fallback",
                    "reveal_solution": False,
                }
            )
        )
        decision = self._parse_decision(raw_text)
        if extractor.full_utterance and not (decision.utterance or "").strip():
            decision = decision.model_copy(
                update={"utterance": extractor.full_utterance, "speak": True}
            )
        decision = policy.filter_decision(decision, state=machine.state, now=self._clock.now())
        decision = self._advisor.refine(
            decision, ctx=ctx, state=machine.state, mode=session.mode, event=event
        )

        result = await self._finalize_decision(
            event=event,
            session=session,
            machine=machine,
            policy=policy,
            ctx=ctx,
            turn=turn,
            decision=decision,
            trace=trace,
        )
        if result is None:
            yield {
                "type": "final",
                "sessionId": event.session_id,
                "state": machine.state.value,
                "uiState": session.ui_state.value,
                "turnId": str(turn),
                "utterance": "",
                "decision": "cancelled",
                "cancelled": True,
                "latency": trace.summary(),
            }
            return
        yield {"type": "final", **self._result_payload(result)}

    def _check_idempotency(
        self, event: InterviewEvent, ctx: SessionContext
    ) -> OrchestratorResult | None:
        client_id = event.payload.get("client_event_id") or event.payload.get("idempotency_key")
        if isinstance(client_id, str) and ctx.remember_client_event(client_id):
            logger.info(
                "Duplicate client event %s for session %s — skipping",
                client_id,
                event.session_id,
            )
            session = self._sessions[event.session_id]
            machine = self._machines[event.session_id]
            return OrchestratorResult(
                session_id=event.session_id,
                state=machine.state,
                ui_state=session.ui_state,
                turn_id=None,
                decision=InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="duplicate_client_event",
                ),
                utterance="",
                duplicate=True,
            )
        if (
            event.type == InterviewEventType.INTERVIEW_STARTED
            and ctx.interview_started
            and ctx.asked_questions
        ):
            session = self._sessions[event.session_id]
            machine = self._machines[event.session_id]
            return OrchestratorResult(
                session_id=event.session_id,
                state=machine.state,
                ui_state=session.ui_state,
                turn_id=None,
                decision=InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="duplicate_interview_started",
                ),
                utterance="",
                duplicate=True,
            )
        return None

    async def _finalize_decision(
        self,
        *,
        event: InterviewEvent,
        session,
        machine,
        policy,
        ctx: SessionContext,
        turn: TurnId,
        decision: InterviewerDecision,
        trace: LatencyTrace,
    ) -> OrchestratorResult | None:
        if self.is_turn_cancelled(str(turn)):
            session.ui_state = AgentUiState.LISTENING
            self._sessions_mgr.persist(event.session_id)
            return None

        if decision.advance_to:
            target = machine.parse_advance_target(decision.advance_to)
            if target and machine.can_transition(target):
                machine.transition(target)
                session.state = machine.state

        utterance = to_spoken_utterance(decision.safe_utterance()) if decision.speak else ""
        if utterance and self._deduper.is_near_duplicate(utterance, ctx.asked_questions):
            logger.info("Suppressed near-duplicate utterance for session %s", event.session_id)
            utterance = ""
            decision = InterviewerDecision(
                decision=DecisionKind.REMAIN_SILENT,
                speak=False,
                utterance="",
                rationale="duplicate_question_suppressed",
            )

        if utterance:
            ctx.add_turn(
                ConversationTurn(role="interviewer", content=utterance, turn_id=str(turn))
            )
            if "?" in utterance:
                ctx.asked_questions.append(utterance)
            session.ui_state = AgentUiState.SPEAKING
        else:
            session.ui_state = AgentUiState.IDLE
            session.active_turn_id = None

        if event.type == InterviewEventType.INTERVIEW_STARTED:
            ctx.interview_started = True

        ctx.last_processed_event_id = event.event_id
        session.state = machine.state
        result = OrchestratorResult(
            session_id=event.session_id,
            state=machine.state,
            ui_state=session.ui_state,
            turn_id=str(turn),
            decision=decision,
            utterance=utterance,
            latency=trace.summary(),
        )
        await self._bus.publish(
            InterviewEvent(
                type=InterviewEventType.INTERVIEWER_TURN_COMPLETED,
                session_id=event.session_id,
                payload={
                    "turn_id": str(turn),
                    "utterance": utterance,
                    "state": machine.state.value,
                    "ui_state": session.ui_state.value,
                    "decision": decision.decision.value,
                    "latency": result.latency,
                },
            )
        )
        self._sessions_mgr.persist(event.session_id)
        return result

    def _result_payload(self, result: OrchestratorResult) -> dict:
        return {
            "sessionId": result.session_id,
            "state": result.state.value,
            "uiState": result.ui_state.value,
            "turnId": result.turn_id,
            "utterance": result.utterance,
            "decision": result.decision.decision.value,
            "cancelled": False,
            "duplicate": result.duplicate,
            "latency": result.latency,
        }

    def _ingest_side_effects(self, event, session, machine, ctx: SessionContext) -> None:
        if event.type == InterviewEventType.INTERVIEW_STARTED:
            if machine.state == InterviewState.QUESTION_OPEN:
                machine.transition(InterviewState.DISCOVERY)
                session.state = machine.state

        if event.type == InterviewEventType.CANDIDATE_TURN_FINALIZED:
            text = str(event.payload.get("text", "")).strip()
            if text:
                ctx.add_turn(ConversationTurn(role="candidate", content=text))
                self._advisor.ingest_candidate_text(ctx, text)

        if event.type == InterviewEventType.CODE_SNAPSHOT_CREATED:
            session.ui_state = AgentUiState.ANALYZING
            version = self._sessions_mgr.next_code_version(event.session_id)
            ctx.add_snapshot(
                CodeSnapshot(
                    version=version,
                    language=str(event.payload.get("language", "unknown")),
                    code=str(event.payload.get("code", "")),
                    diff_summary=event.payload.get("diff_summary"),
                )
            )
            if machine.state == InterviewState.APPROACH_REVIEW and machine.can_transition(
                InterviewState.CODING
            ):
                machine.transition(InterviewState.CODING)
                session.state = machine.state

        if event.type in {
            InterviewEventType.EXECUTION_COMPLETED,
            InterviewEventType.EXECUTION_FAILED,
        }:
            session.ui_state = AgentUiState.ANALYZING
            if machine.state == InterviewState.CODING and machine.can_transition(
                InterviewState.TESTING
            ):
                machine.transition(InterviewState.TESTING)
                session.state = machine.state
            status = str(event.payload.get("status", "UNKNOWN"))
            if status not in {"ACCEPTED", "OK"} and machine.state == InterviewState.TESTING:
                if machine.can_transition(InterviewState.CODING):
                    machine.transition(InterviewState.CODING)
                    session.state = machine.state
            ctx.last_execution = ExecutionSummary(
                status=status,
                mode=str(event.payload.get("mode", "")),
                passed=event.payload.get("passed"),
                failed=event.payload.get("failed"),
                stderr=event.payload.get("stderr"),
                notes=event.payload.get("notes"),
            )
            ctx.push_unique(ctx.topics_explored, "execution")

    def _parse_decision(self, text: str) -> InterviewerDecision:
        raw = text.strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.startswith("json"):
                raw = raw[4:].strip()
        try:
            data = json.loads(raw)
            return InterviewerDecision.model_validate(data)
        except Exception:
            logger.warning("Invalid LLM JSON; using fallback utterance")
            cleaned = raw[:500] if raw and not raw.startswith("{") else (
                "Could you walk me through your understanding of the problem so far?"
            )
            return InterviewerDecision(
                decision=DecisionKind.SPEAK,
                speak=True,
                utterance=cleaned,
                confidence=0.2,
                rationale="json_parse_fallback",
            )
