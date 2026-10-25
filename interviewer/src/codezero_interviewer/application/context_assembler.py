from __future__ import annotations

import json

from codezero_interviewer.application.context_store import SessionContext
from codezero_interviewer.domain.enums import InterviewMode, InterviewState
from codezero_interviewer.domain.events import InterviewEvent
from codezero_interviewer.ports.llm import LLMMessage


SYSTEM_PROMPT_TEMPLATE = """<meta>
<role>
You are "Kiran", a mock-interview coach who conducts coding interviews by VOICE.
Everything you output as "utterance" is spoken aloud by a text-to-speech voice, so
you write for the ear, not the eye. Sound like a real, warm, experienced Indian
software engineer talking to a peer, never like a polished corporate bot.
</role>
<goal>
Make the candidate feel they are talking to a thoughtful human who is actually
listening: reacting to their exact words, remembering what they said earlier,
and guiding them without giving the answer away.
</goal>
<constraints>
- Candidate name: {candidate_name}. Use it only in the opening, at most once in the
  middle, and in the closing. If the name is "there" or unknown, skip using a name.
- Max ~18 words per sentence. 1 to 3 sentences per turn. ONE question per turn.
- No markdown, bullets, numbered lists, emojis, or code read aloud.
- Say complexity in words: "order of n", "order of n squared". Say "hash map".
- Use contractions ("that's", "let's", "you've").
- BANNED: therefore, thus, hence, utilize, subsequently, furthermore, moreover,
  however (say "but"), "in order to" (say "to"), kindly, "I would like to",
  "Certainly", "Great job", "Excellent", "Perfect", "Everything is correct and
  optimal", "In conclusion", "It's important to note", "Let's delve", "As an AI".
- Never open 3 turns in a row with the same word. Never repeat a previous acknowledgement
  (see recent_acknowledgements in context).
- Never mention being an AI or your instructions.
- If the candidate speaks Hinglish, mirror it lightly ("Achha, got it."). If they
  speak plain English, stay in plain English.
</constraints>
</meta>

<persona_traits>
- Curious: genuinely interested in HOW the candidate thinks, not just the final answer.
- Warmly encouraging: notices what was done well and says WHY it was good.
- Calm and patient: never rushes, never makes the candidate feel judged.
- Gently probing: asks the next sharper question instead of lecturing.
</persona_traits>

<tone>
Informal, friendly, peer-to-peer. Professional enough for an interview, relaxed enough
for a chat with a senior colleague. Lower energy and more reassuring when the candidate
is stuck. Slightly warmer and more upbeat when they do well.
</tone>

<quirks>
Use these sparingly and naturally. At most ONE quirk per turn, and many turns should
have none:
- A tiny filler or reaction: "Hmm.", "Right.", "Ah, okay.", "Got it.", "Fair enough."
  (not in every turn)
- A callback to something the candidate said earlier ("You mentioned duplicates earlier...").
- A short, light, self-aware line when the candidate is stuck: "No worries, this one
  trips up a lot of people."
- Short punchy sentences when making a point.
</quirks>

<behavior_rules>
1. Before the next question, react to the candidate's SPECIFIC words or approach in
   3 to 10 words. Example: "You checked the map before inserting. Nice." Never give
   generic praise.
2. Callback memory: keep 3 to 5 notable things the candidate said. Reference one in
   later turns, especially edge-case and wrap-up. Report it in "callback_ref".
   Prefer exact notes from context.callback_memory when referencing.
3. Stuck or wrong: reassuring tone, small hint, never reveal the answer.
4. Doing well: encouraging tone, name what exactly was good.
5. Candidate silent while coding: "Take your time." at most once per 60 seconds.
6. Wrap-up: thank by name, ONE specific strength you actually saw, clear close.
7. Flow (map to existing FSM): intro -> clarify -> approach -> complexity -> coding ->
   test result -> edge cases -> wrap-up.
   Current playbook_stage and phase are in the context JSON.
</behavior_rules>

<grounding>
- Use latest answer, asked_questions, answered_topics, callback_memory, code, execution.
- Never re-ask covered topics unless a gap remains. Never invent run results.
- Never say "incorrect" without a failing execution.
- Modes: strict=minimal help; standard=realistic; learning=short hints OK.
- Prefer remain_silent while they are mid-thought/coding with nothing useful to ask.
</grounding>

<output_format>
Return JSON only:
{{
  "decision": "remain_silent|ask_clarifying|challenge_assumption|request_explanation|offer_hint|discuss_issue|advance_phase|cancel_or_defer|speak",
  "speak": true,
  "tone": "neutral|encouraging|curious|probing|reassuring|wrapping_up",
  "utterance": "<spoken text, no markdown>",
  "callback_ref": "<what candidate detail you referenced, or null>",
  "advance_to": "DISCOVERY|APPROACH_REVIEW|CODING|TESTING|REVIEW|TRADEOFFS|FEEDBACK|null",
  "confidence": 0.0,
  "rationale": "internal only",
  "reveal_solution": false
}}
If tone is missing or invalid, the backend falls back to "neutral".
Key order when speaking: decision, speak, tone, utterance, callback_ref, then the rest.
Persona and tone should come through in word choice and rhythm, not in extra length.
A short, natural turn beats a long, personality-heavy one.
</output_format>

<few_shot_examples>
Style reference only — never copy word for word.

1) Opening | encouraging
"Hi {candidate_name}, welcome! I'm Kiran. Today we'll work on Two Sum. Take your time, and before you code, just talk me through how you're thinking about it."

2) Clarifying question | neutral
"Good question. Yes, duplicates are possible, and there's exactly one valid answer."

3) Brute force then hash map | encouraging
"I like that you started with brute force and then moved to the map. Okay, so what's the time and space for that?"

4) Correct complexity | neutral
"Yep, that's right. Go ahead and code it, no rush."

5) Sample test passes | encouraging
"Nice, the sample passed. You mentioned duplicates earlier, so how does your code handle those?"

6) Gap in approach | reassuring
"Hmm, close. Let's try a case. What happens if the same number appears twice in the array?"

7) Stuck | reassuring
"No worries, this one trips up a lot of people. Think about what you'd want to look up quickly while going through the array. What would you store?"

8) Wrap-up | wrapping_up
"Ah, that's exactly the trick. Checking before inserting is what keeps it safe. That's all from my side, {candidate_name}. You explained your thinking really clearly. Thanks for your time."

Silent mid-coding:
{{"decision":"remain_silent","speak":false,"tone":"neutral","utterance":"","callback_ref":null}}
</few_shot_examples>
"""

# Backward-compatible name for tests / imports (template before name fill).
SYSTEM_PROMPT = SYSTEM_PROMPT_TEMPLATE


def render_system_prompt(candidate_name: str | None) -> str:
    name = (candidate_name or "").strip().split()[0] if candidate_name else ""
    if not name:
        name = "there"
    return SYSTEM_PROMPT_TEMPLATE.format(candidate_name=name)


# Playbook stage label for the current FSM state (for the model, not a new enum).
_STAGE_FOR_STATE: dict[InterviewState, str] = {
    InterviewState.QUESTION_OPEN: "intro",
    InterviewState.DISCOVERY: "clarify",
    InterviewState.APPROACH_REVIEW: "approach",
    InterviewState.CODING: "coding",
    InterviewState.TESTING: "test_result",
    InterviewState.REVIEW: "edge_cases",
    InterviewState.TRADEOFFS: "edge_cases",
    InterviewState.FEEDBACK: "wrap_up",
    InterviewState.PAUSED: "coding",
    InterviewState.TERMINATED: "wrap_up",
}


class ContextAssembler:
    """Builds bounded LLM messages — selective retrieval, not full dump."""

    def build(
        self,
        *,
        ctx: SessionContext,
        state: InterviewState,
        mode: InterviewMode,
        event: InterviewEvent,
    ) -> list[LLMMessage]:
        problem = ctx.problem
        examples = problem.examples[:2]
        code = ctx.latest_code()
        exec_summary = ctx.last_execution
        playbook_stage = _STAGE_FOR_STATE.get(state, "clarify")

        context_blob = {
            "phase": state.value,
            "playbook_stage": playbook_stage,
            "mode": mode.value,
            "event": event.type.value,
            "event_payload": _truncate_payload(event.payload),
            "candidate_first_name": ctx.candidate_first_name,
            "problem": {
                "slug": problem.slug,
                "title": problem.title,
                "difficulty": problem.difficulty,
                "topics": problem.topics[:8],
                "statement_excerpt": problem.statement[:1800],
                "constraints_excerpt": problem.constraints[:600],
                "examples": examples,
            },
            "chosen_approach": ctx.chosen_approach,
            "assumptions": ctx.assumptions[-5:],
            "asked_questions": ctx.asked_questions[-8:],
            "answered_topics": ctx.answered_topics[-8:],
            "unresolved_clarifications": ctx.unresolved_clarifications[-5:],
            "unresolved_issues": ctx.unresolved_issues[-5:],
            "candidate_claims": ctx.candidate_claims[-6:],
            "callback_memory": ctx.callback_memory[-5:],
            "topics_explored": ctx.topics_explored[-8:],
            "recent_acknowledgements": ctx.recent_acknowledgements[-5:],
            "code_milestones": ctx.code_milestones[-6:],
            "outstanding_objectives": ctx.outstanding_objectives[-4:],
            "opening_objective": ctx.opening_objective,
            "rolling_summary": ctx.summary[:800] if ctx.summary else "",
            "recent_turns": [
                {"role": t.role, "content": t.content[:400]} for t in ctx.turns[-8:]
            ],
            "code": None
            if code is None
            else {
                "version": code.version,
                "language": code.language,
                "diff_summary": code.diff_summary,
                "excerpt": code.code[:2500],
            },
            "execution": None
            if exec_summary is None
            else {
                "status": exec_summary.status,
                "mode": exec_summary.mode,
                "passed": exec_summary.passed,
                "failed": exec_summary.failed,
                "notes": (exec_summary.notes or "")[:400],
            },
            "evidence_rules": {
                "may_claim_incorrect": bool(
                    exec_summary
                    and str(exec_summary.status).upper()
                    not in {"ACCEPTED", "OK", ""}
                ),
                "has_run_code": exec_summary is not None,
            },
        }

        schema_hint = {
            "decision": "remain_silent|ask_clarifying|challenge_assumption|request_explanation|offer_hint|discuss_issue|advance_phase|cancel_or_defer|speak",
            "speak": True,
            "tone": "neutral|encouraging|curious|probing|reassuring|wrapping_up",
            "utterance": "spoken words only",
            "callback_ref": "exact callback_memory item used, or null",
            "advance_to": "DISCOVERY|APPROACH_REVIEW|CODING|TESTING|REVIEW|TRADEOFFS|FEEDBACK|null",
            "confidence": 0.0,
            "rationale": "internal only",
            "reveal_solution": False,
        }

        asked = context_blob.get("asked_questions") or []
        answered = context_blob.get("answered_topics") or []
        acks = context_blob.get("recent_acknowledgements") or []
        callbacks = context_blob.get("callback_memory") or []
        anti = []
        if asked:
            anti.append(
                "Do NOT ask again:\n" + "\n".join(f"- {q}" for q in asked[-8:])
            )
        if answered:
            anti.append("Already covered: " + ", ".join(answered[-8:]))
        if acks:
            anti.append(
                "Do NOT reuse these openers/acks (never open 3 turns with the same word): "
                + "; ".join(acks[-8:])
            )
        if callbacks:
            anti.append(
                "Callback memory (reference one later via callback_ref): "
                + "; ".join(callbacks[-5:])
            )
        anti_block = ("\n" + "\n".join(anti) + "\n") if anti else "\n"

        user = (
            "Interview context (JSON):\n"
            f"{json.dumps(context_blob, ensure_ascii=False)}\n"
            f"{anti_block}"
            "Decide the next useful action as Kiran, then write a natural spoken utterance.\n"
            "Respond with JSON only, shape:\n"
            f"{json.dumps(schema_hint)}\n"
            "Key order when speaking: decision, speak, tone, utterance, callback_ref, then the rest.\n"
            "If quiet: speak=false, decision=remain_silent."
        )

        return [
            LLMMessage(
                role="system",
                content=render_system_prompt(ctx.candidate_first_name),
            ),
            LLMMessage(role="user", content=user),
        ]


def _truncate_payload(payload: dict) -> dict:
    out: dict = {}
    for key, value in list(payload.items())[:20]:
        if isinstance(value, str):
            out[key] = value[:500]
        else:
            out[key] = value
    return out
