"""Deterministic interview intelligence — grounds decisions in problem/code/exec.

Runs before/after the LLM suggestion. Does not invent execution results.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone

from codezero_interviewer.application.context_store import SessionContext
from codezero_interviewer.application.opening_pool import pick_opening
from codezero_interviewer.application.question_dedupe import QuestionDeduper, content_tokens
from codezero_interviewer.application.spoken_style import to_spoken_utterance
from codezero_interviewer.domain.actions import DecisionKind, InterviewerDecision
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType

_COMPLEXITY_CLAIM = re.compile(
    r"\b(o\s*\(\s*n(?:\s*\^\s*2)?\s*\)|o\s*\(\s*1\s*\)|o\s*\(\s*n\s*log|linear|quadratic|constant\s+time)\b",
    re.I,
)
_APPROACH_MARKERS = re.compile(
    r"\b(hash\s*map|hashtable|dictionary|two\s*pointer|binary\s*search|dp|dynamic|"
    r"bfs|dfs|stack|queue|greedy|brute\s*force|sliding\s*window)\b",
    re.I,
)
_DUPLICATE_MARKERS = re.compile(
    r"\b(duplicates?|same (?:number|element|value)|appear(?:s|ed)? twice)\b",
    re.I,
)
_BRUTE_FORCE = re.compile(r"\bbrute\s*force\b", re.I)
_CHECK_BEFORE_INSERT = re.compile(
    r"\b(check(?:ing)? (?:the )?(?:map|dict|hash).{0,24}before (?:insert|add)|"
    r"look ?up before insert)\b",
    re.I,
)


@dataclass(frozen=True, slots=True)
class OpeningPlan:
    objective: str
    suggested_utterance: str
    topics: tuple[str, ...]


class DecisionAdvisor:
    """Strategy-style advisor: mode + context → objectives and decision filtering."""

    def __init__(self, deduper: QuestionDeduper | None = None) -> None:
        self._deduper = deduper or QuestionDeduper()

    def plan_opening(self, ctx: SessionContext, mode: InterviewMode) -> OpeningPlan:
        topics = tuple(ctx.problem.topics[:4])
        ambiguity = self._detect_ambiguity(ctx.problem.statement, ctx.problem.constraints)
        if ambiguity and mode != InterviewMode.LEARNING:
            objective = f"Clarify genuine ambiguity: {ambiguity}."
            utterance = f"Quick check on {ctx.problem.title}: {ambiguity}"
        else:
            objective, utterance = pick_opening(ctx, mode)
        return OpeningPlan(objective=objective, suggested_utterance=utterance, topics=topics)

    def ingest_candidate_text(self, ctx: SessionContext, text: str) -> None:
        t = text.strip()
        if not t:
            return
        if _APPROACH_MARKERS.search(t):
            m = _APPROACH_MARKERS.search(t)
            claim = m.group(0).lower() if m else t[:120]
            ctx.push_unique(ctx.candidate_claims, claim)
            ctx.chosen_approach = ctx.chosen_approach or claim
            ctx.push_unique(ctx.topics_explored, "approach")
            ctx.push_unique(ctx.answered_topics, "approach")
            if _BRUTE_FORCE.search(t):
                self._remember(ctx, "started with brute force")
            else:
                self._remember(ctx, claim)
        complexity = _COMPLEXITY_CLAIM.search(t)
        if complexity:
            ctx.push_unique(ctx.candidate_claims, complexity.group(0))
            ctx.push_unique(ctx.topics_explored, "complexity")
            ctx.push_unique(ctx.answered_topics, "complexity")
            self._remember(ctx, f"claimed {complexity.group(0)}")
        if _DUPLICATE_MARKERS.search(t):
            self._remember(ctx, "mentioned duplicates")
        if _CHECK_BEFORE_INSERT.search(t):
            self._remember(ctx, "check before insert")
        if re.search(r"\b(assume|assuming|assumption)\b", t, re.I):
            ctx.push_unique(ctx.assumptions, t[:200])
            ctx.push_unique(ctx.topics_explored, "assumptions")
        # Resolve clarifications that look answered
        for q in list(ctx.unresolved_clarifications):
            q_tokens = content_tokens(q)
            if q_tokens and len(q_tokens & content_tokens(t)) >= max(2, len(q_tokens) // 2):
                ctx.unresolved_clarifications.remove(q)
                ctx.push_unique(ctx.answered_topics, "clarification")

    def _remember(self, ctx: SessionContext, note: str) -> None:
        """Keep 3–5 notable callbacks for later reference."""
        ctx.push_unique(ctx.callback_memory, note, limit=5)

    def prefer_deterministic(
        self,
        *,
        event: InterviewEvent,
        ctx: SessionContext,
        state: InterviewState,
        mode: InterviewMode,
    ) -> InterviewerDecision | None:
        """Return a grounded decision when LLM is unnecessary or unsafe to free-run."""

        if event.type == InterviewEventType.INTERVIEW_STARTED:
            if ctx.interview_started and ctx.asked_questions:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="duplicate_interview_started",
                )
            plan = self.plan_opening(ctx, mode)
            ctx.opening_objective = plan.objective
            ctx.outstanding_objectives = [plan.objective]
            for topic in plan.topics:
                ctx.push_unique(ctx.topics_explored, topic.lower())
            return InterviewerDecision(
                decision=DecisionKind.ASK_CLARIFYING,
                speak=True,
                utterance=plan.suggested_utterance,
                advance_to="DISCOVERY",
                confidence=0.85,
                rationale="problem_grounded_opening",
                reveal_solution=False,
                tone="encouraging",
            )

        if event.type in {
            InterviewEventType.EXECUTION_FAILED,
            InterviewEventType.EXECUTION_COMPLETED,
        }:
            status = str(event.payload.get("status", "")).upper()
            failed = event.payload.get("failed")
            notes = str(event.payload.get("notes") or event.payload.get("stderr") or "")[:200]
            if status in {"ACCEPTED", "OK"} or (
                event.type == InterviewEventType.EXECUTION_COMPLETED and not failed
            ):
                cb = next(
                    (c for c in ctx.callback_memory if "duplicate" in c.lower()),
                    None,
                )
                if cb:
                    return InterviewerDecision(
                        decision=DecisionKind.REQUEST_EXPLANATION,
                        speak=True,
                        utterance=(
                            "That run passed. You mentioned duplicates earlier — "
                            "what if every value is the same?"
                        ),
                        confidence=0.8,
                        rationale="exec_pass_edge_probe",
                        tone="curious",
                        callback_ref=cb,
                    )
                if "complexity" in {t.lower() for t in ctx.answered_topics}:
                    return InterviewerDecision(
                        decision=DecisionKind.REQUEST_EXPLANATION,
                        speak=True,
                        utterance="That run passed. Which edge case are you least sure about?",
                        confidence=0.8,
                        rationale="exec_pass_edge_probe",
                        tone="curious",
                    )
                if mode == InterviewMode.STRICT:
                    return InterviewerDecision(
                        decision=DecisionKind.REQUEST_EXPLANATION,
                        speak=True,
                        utterance="Okay. What would the time and space complexity be here?",
                        confidence=0.8,
                        rationale="exec_pass_complexity_probe",
                        tone="probing",
                    )
                return InterviewerDecision(
                    decision=DecisionKind.REQUEST_EXPLANATION,
                    speak=True,
                    utterance="That run passed. Why do you trust it on the edge cases?",
                    confidence=0.8,
                    rationale="exec_pass_edge_probe",
                    tone="encouraging",
                )
            # Genuine failure — discuss evidence, do not invent the bug.
            evidence = notes.strip() or status or "the failing case"
            ctx.push_unique(ctx.unresolved_issues, f"{status}:{evidence[:120]}")
            return InterviewerDecision(
                decision=DecisionKind.DISCUSS_ISSUE,
                speak=True,
                utterance=(
                    f"No worries — that run came back {status}. "
                    f"Which input do you think breaks this?"
                ),
                confidence=0.88,
                rationale="exec_failure_evidence",
                tone="reassuring",
            )

        if event.type == InterviewEventType.CODE_SNAPSHOT_CREATED:
            if mode == InterviewMode.STRICT:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="strict_silent_while_coding",
                )
            if state == InterviewState.CODING and self._coding_nudge_due(ctx):
                ctx.last_coding_nudge_at = datetime.now(timezone.utc).isoformat()
                return InterviewerDecision(
                    decision=DecisionKind.SPEAK,
                    speak=True,
                    utterance="Take your time.",
                    confidence=0.7,
                    rationale="coding_silence_nudge",
                    tone="reassuring",
                )
            if mode == InterviewMode.STANDARD and state == InterviewState.CODING:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="coding_snapshot_silent",
                )

        return None

    def _coding_nudge_due(self, ctx: SessionContext) -> bool:
        """At most one light coding-silence line per 60s."""
        raw = ctx.last_coding_nudge_at
        if not raw:
            # First snapshot after a quiet stretch — wait for a later idle tick.
            # Mark a sentinel so the *next* eligible idle can nudge.
            if not ctx.code_milestones:
                return False
            # Allow nudge when we already have code activity and never nudged.
            return len(ctx.code_milestones) >= 2
        try:
            last = datetime.fromisoformat(raw)
        except ValueError:
            return True
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - last).total_seconds() >= 60.0

    def refine(
        self,
        decision: InterviewerDecision,
        *,
        ctx: SessionContext,
        state: InterviewState,
        mode: InterviewMode,
        event: InterviewEvent,
    ) -> InterviewerDecision:
        """Post-LLM filter: dedupe, evidence rules, mode constraints, objectives."""

        # Prefer deterministic path for interview.started / execution already handled upstream.
        det = self.prefer_deterministic(event=event, ctx=ctx, state=state, mode=mode)
        if det is not None and event.type in {
            InterviewEventType.INTERVIEW_STARTED,
            InterviewEventType.EXECUTION_FAILED,
            InterviewEventType.EXECUTION_COMPLETED,
        }:
            # If we already used deterministic for these in orchestrator, this is backup.
            if decision.rationale in {"", "json_parse_fallback", "stream_fallback"}:
                decision = det

        if decision.speak and (decision.utterance or "").strip():
            cleaned = to_spoken_utterance(decision.safe_utterance())
            if cleaned != (decision.utterance or "").strip():
                decision = decision.model_copy(update={"utterance": cleaned})
            if not cleaned:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="empty_after_spoken_sanitize",
                )

        utterance = decision.safe_utterance() if decision.speak else ""
        prior = list(ctx.asked_questions) + list(ctx.unresolved_clarifications)
        if utterance and self._deduper.is_near_duplicate(utterance, prior):
            # Try a grounded alternative instead of silence when possible.
            alt = self._alternative_question(ctx, state, mode)
            if alt and not self._deduper.is_near_duplicate(alt, prior):
                decision = decision.model_copy(
                    update={
                        "utterance": alt,
                        "decision": DecisionKind.REQUEST_EXPLANATION,
                        "speak": True,
                        "rationale": (decision.rationale or "") + "|dedupe_rewritten",
                    }
                )
            else:
                return InterviewerDecision(
                    decision=DecisionKind.REMAIN_SILENT,
                    speak=False,
                    utterance="",
                    rationale="duplicate_question_suppressed",
                )

        # Never claim code is wrong without execution evidence.
        if utterance and re.search(r"\b(incorrect|wrong|broken|bug)\b", utterance, re.I):
            if ctx.last_execution is None or str(ctx.last_execution.status).upper() in {
                "ACCEPTED",
                "OK",
            }:
                decision = decision.model_copy(
                    update={
                        "utterance": (
                            "I'm not marking this incorrect without a failing run. "
                            "What edge case are you most worried about?"
                        ),
                        "decision": DecisionKind.REQUEST_EXPLANATION,
                        "rationale": (decision.rationale or "") + "|no_false_incorrect",
                    }
                )

        if decision.decision == DecisionKind.OFFER_HINT and mode == InterviewMode.LEARNING:
            # Allow hints; keep them graduated (already utterance from LLM).
            pass

        # Track clarification objectives
        final_u = decision.safe_utterance() if decision.speak else ""
        if final_u and "?" in final_u and decision.decision == DecisionKind.ASK_CLARIFYING:
            ctx.push_unique(ctx.unresolved_clarifications, final_u)

        # Persist callback_ref + opening word (anti-repeat for quirks / fillers).
        ref = (decision.callback_ref or "").strip()
        if ref:
            ctx.push_unique(ctx.recent_acknowledgements, f"callback:{ref}", limit=8)
        final_spoken = decision.safe_utterance() if decision.speak else ""
        if final_spoken:
            first = final_spoken.split()[0].strip(".,!?").lower()
            if first:
                ctx.push_unique(ctx.recent_acknowledgements, f"opener:{first}", limit=8)

        return decision

    def _alternative_question(
        self, ctx: SessionContext, state: InterviewState, mode: InterviewMode
    ) -> str | None:
        explored = set(t.lower() for t in ctx.topics_explored)
        answered = set(t.lower() for t in ctx.answered_topics)

        if "complexity" not in answered and state in {
            InterviewState.APPROACH_REVIEW,
            InterviewState.CODING,
            InterviewState.TESTING,
            InterviewState.REVIEW,
        }:
            claim = next((c for c in ctx.candidate_claims if "o(" in c.lower() or "linear" in c.lower()), None)
            if claim:
                return f"You mentioned {claim}. Which part of the algorithm drives that cost?"
            return "Okay. What would the time complexity be?"

        if "edge_case" not in explored and state in {
            InterviewState.CODING,
            InterviewState.TESTING,
            InterviewState.APPROACH_REVIEW,
        }:
            return "Which edge case would you check first?"

        if ctx.last_execution and str(ctx.last_execution.status).upper() not in {
            "ACCEPTED",
            "OK",
        }:
            return "Given that result, would you change the idea or just the implementation?"

        if "tradeoffs" not in explored and state in {
            InterviewState.REVIEW,
            InterviewState.TRADEOFFS,
        }:
            return "What's the main trade-off versus a simpler approach?"

        if mode == InterviewMode.LEARNING and "hint_ladder" not in explored:
            return "Want a small hint on the data structure, or keep thinking?"

        if ctx.outstanding_objectives:
            return None
        return "What do you want to dig into next?"

    @staticmethod
    def _detect_ambiguity(statement: str, constraints: str) -> str | None:
        blob = f"{statement}\n{constraints}".lower()
        # Only flag when the statement itself is vague — not inventing clarifications.
        if "follow-up" in blob or "follow up" in blob:
            return None
        cues: list[tuple[str, str]] = [
            (r"\bunique\b", "Are duplicate values allowed in the input?"),
            (r"\bsorted\b", "Can we rely on the input already being sorted?"),
            (r"\bin[- ]place\b", "Is an in-place solution required, or is extra space fine?"),
            (r"\bempty\b", "How should empty or single-element inputs be handled?"),
        ]
        # Ambiguity only if constraint language is missing answers.
        for pattern, question in cues:
            if re.search(pattern, blob) and "must" not in blob:
                # Weak signal — prefer topics-based opening unless clearly underspecified.
                if "example" not in blob:
                    return question
        if len(statement.strip()) < 80 and not constraints.strip():
            return "The statement is quite short — what constraints are you assuming?"
        return None
