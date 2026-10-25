from __future__ import annotations

import asyncio
import json
import logging
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from codezero_interviewer.application.pronunciation import default_lexicon, rewrite_for_speech
from codezero_interviewer.domain.entities import ProblemContext
from codezero_interviewer.domain.enums import InterviewMode
from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType
from codezero_interviewer.domain.voice_profile import VoiceProfile
from codezero_interviewer.infrastructure.config import InterviewerSettings
from codezero_interviewer.infrastructure.factory import build_orchestrator
from codezero_interviewer.tts.edge_provider import DEFAULT_EDGE_VOICE
from codezero_interviewer.tts.service import TtsService

logger = logging.getLogger(__name__)

settings = InterviewerSettings()
orchestrator = build_orchestrator(settings)
def _resolve_edge_voice(voice_id: str | None) -> str:
    if voice_id and "Neural" in voice_id:
        return voice_id
    return DEFAULT_EDGE_VOICE


tts_service = TtsService(
    cache_dir=settings.tts_cache_dir,
    default_voice=_resolve_edge_voice(settings.voice_id),
    timeout_s=settings.tts_timeout_s,
    provider_name=settings.tts_provider,
)
app = FastAPI(title="CodeZero Interviewer Runtime", version="0.1.0")


def _voice_profile() -> VoiceProfile:
    return VoiceProfile(
        assistant_name=settings.assistant_name,
        locale=settings.voice_locale,
        rate=settings.voice_rate,
        pitch=settings.voice_pitch,
        voice_id=settings.voice_id,
        engine=settings.voice_engine,
    )


class ProblemBody(BaseModel):
    slug: str
    title: str
    difficulty: str = "UNKNOWN"
    statement: str = ""
    constraints: str = ""
    examples: list[dict[str, Any]] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    language: str | None = None


class CreateSessionBody(BaseModel):
    problem: ProblemBody
    mode: str = "standard"
    session_id: str | None = None
    # If true and session_id already exists (memory or disk), restore instead of wiping.
    restore_if_present: bool = False
    candidate_first_name: str | None = None


class EventBody(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model": settings.ollama_model,
        "ollama_base_url": settings.ollama_base_url,
        "assistant": settings.assistant_name,
        "voice": {
            "locale": settings.voice_locale,
            "engine": settings.voice_engine,
        },
    }


@app.get("/voice/profile")
async def voice_profile() -> dict[str, Any]:
    """Public voice identity for the UI — no provider-specific hardcoding required."""
    profile = _voice_profile()
    lex = default_lexicon()
    return {
        **profile.to_public_dict(),
        "ttsProvider": settings.tts_provider,
        "defaultEdgeVoice": settings.voice_id or DEFAULT_EDGE_VOICE,
        "evaluationPhrases": list(lex.evaluation_phrases),
        "notes": [
            "Neural TTS: edge-tts (en-IN-NeerjaNeural). Browser speechSynthesis is FE fallback.",
            "POST /tts returns audio/mpeg; cache under ~/.codezero/interviewer/tts_cache.",
        ],
    }


class PreviewBody(BaseModel):
    text: str = "What is the time complexity of your hash map approach?"
    tone: str = "neutral"
    voice: str | None = None


class TtsBody(BaseModel):
    text: str
    voice: str | None = None
    tone: str = "neutral"
    session_id: str | None = None
    rate: float = 1.0
    pitch: float = 1.0
    volume: float = 1.0


@app.post("/tts")
async def synthesize_tts(body: TtsBody) -> Response:
    """Synthesize speech (Edge TTS). Returns audio/mpeg; 504 on timeout for FE fallback."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text required")
    try:
        result = await tts_service.synthesize(
            body.text,
            voice=body.voice,
            tone=body.tone,
            rate=body.rate,
            pitch=body.pitch,
            volume=body.volume,
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("TTS failed")
        raise HTTPException(status_code=502, detail=f"TTS failed: {exc}") from exc
    headers = {
        "X-TTS-Provider": result.provider,
        "X-TTS-Voice": result.voice,
        "X-TTS-Cached": "1" if result.cached else "0",
        "Cache-Control": "private, max-age=86400" if result.cached else "no-store",
    }
    return Response(content=result.audio, media_type=result.content_type, headers=headers)


@app.post("/voice/preview")
async def voice_preview(body: PreviewBody) -> dict[str, Any]:
    """Rewrite + synthesize via Edge TTS (base64) for quick checks."""
    spoken = rewrite_for_speech(body.text)
    result: dict[str, Any] = {
        "original": body.text,
        "spoken": spoken,
        "assistant": settings.assistant_name,
        "locale": settings.voice_locale,
        "audioBase64": None,
        "engineUsed": None,
    }
    try:
        import base64

        synth = await tts_service.synthesize(
            body.text, voice=body.voice, tone=body.tone
        )
        result["audioBase64"] = base64.b64encode(synth.audio).decode("ascii")
        result["engineUsed"] = synth.provider
        result["cached"] = synth.cached
    except Exception as exc:
        result["ttsError"] = str(exc)
    return result


@app.post("/sessions")
async def create_session(body: CreateSessionBody) -> dict[str, Any]:
    try:
        mode = InterviewMode(body.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {body.mode}") from exc

    session_id = body.session_id or str(uuid4())
    problem = ProblemContext(
        slug=body.problem.slug,
        title=body.problem.title,
        difficulty=body.problem.difficulty,
        statement=body.problem.statement,
        constraints=body.problem.constraints,
        examples=body.problem.examples,
        topics=body.problem.topics,
        language=body.problem.language,
    )
    session = orchestrator.open_session(
        session_id,
        problem,
        mode=mode,
        restore_if_present=body.restore_if_present,
        candidate_first_name=body.candidate_first_name,
    )
    # Pre-warm common lines + opening snippets in background (cache hits later).
    warm_lines = [
        "Okay.",
        "Got it.",
        "Right.",
        "Hmm.",
        "Achha, got it.",
        f"Let's start with {problem.title}. What's the core requirement you're solving for?",
        "Okay. What would the time complexity be?",
        "Which edge case would you check first?",
    ]
    asyncio.create_task(tts_service.prewarm(warm_lines))
    return {
        "sessionId": session.session_id,
        "state": session.state.value,
        "uiState": session.ui_state.value,
        "mode": session.mode.value,
        "restored": body.restore_if_present and session.state.value != "QUESTION_OPEN",
    }


@app.post("/sessions/{session_id}/events")
async def post_event(session_id: str, body: EventBody) -> dict[str, Any]:
    try:
        event_type = InterviewEventType(body.type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {body.type}") from exc

    try:
        orchestrator.get_session(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc

    result = await orchestrator.handle(
        InterviewEvent(type=event_type, session_id=session_id, payload=body.payload)
    )
    if result is None:
        session = orchestrator.get_session(session_id)
        return {
            "sessionId": session_id,
            "state": session.state.value,
            "uiState": session.ui_state.value,
            "turnId": None,
            "utterance": "",
            "decision": "cancelled",
            "cancelled": True,
        }

    return {
        "sessionId": result.session_id,
        "state": result.state.value,
        "uiState": result.ui_state.value,
        "turnId": result.turn_id,
        "utterance": result.utterance,
        "decision": result.decision.decision.value,
        "cancelled": False,
        "latency": result.latency,
    }


@app.post("/sessions/{session_id}/events/stream")
async def post_event_stream(session_id: str, body: EventBody) -> StreamingResponse:
    """SSE: speak_chunk events while LLM streams, then a final result object.

    Existing POST /events remains unchanged for non-streaming clients.
    """
    try:
        event_type = InterviewEventType(body.type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {body.type}") from exc

    try:
        orchestrator.get_session(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc

    async def gen():
        event = InterviewEvent(type=event_type, session_id=session_id, payload=body.payload)
        async for item in orchestrator.handle_stream(event):
            yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@app.get("/sessions/{session_id}")
async def get_session(session_id: str) -> dict[str, Any]:
    try:
        return orchestrator.session_view(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Session not found") from exc


@app.post("/sessions/{session_id}/restore")
async def restore_session(session_id: str) -> dict[str, Any]:
    """Reload a persisted session after runtime restart (same session_id)."""
    session = orchestrator.restore_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return orchestrator.session_view(session_id)
