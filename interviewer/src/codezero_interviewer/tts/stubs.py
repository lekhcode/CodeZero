"""Extension points for paid/cloud providers — disabled unless env keys exist."""

from __future__ import annotations

import os

from codezero_interviewer.tts.provider import TtsProvider, TtsRequest, TtsResult
from codezero_interviewer.tts.tone_params import delivery_for


class AzureTtsProvider(TtsProvider):
    """Stub: would use SSML mstts:express-as when AZURE_SPEECH_KEY is set."""

    name = "azure"

    def __init__(self) -> None:
        self.enabled = bool(os.getenv("AZURE_SPEECH_KEY") and os.getenv("AZURE_SPEECH_REGION"))

    async def synthesize(self, request: TtsRequest) -> TtsResult:
        if not self.enabled:
            raise RuntimeError("Azure TTS not configured (set AZURE_SPEECH_KEY/REGION)")
        style = delivery_for(request.tone).azure_style or "general"
        # Placeholder — full Azure REST/SDK wiring left for when keys are provided.
        raise NotImplementedError(
            f"Azure TTS stub: voice={request.voice} style={style} (not implemented yet)"
        )


class ElevenLabsProvider(TtsProvider):
    """Stub: enabled only when ELEVENLABS_API_KEY is present."""

    name = "elevenlabs"

    def __init__(self) -> None:
        self.enabled = bool(os.getenv("ELEVENLABS_API_KEY"))

    async def synthesize(self, request: TtsRequest) -> TtsResult:
        if not self.enabled:
            raise RuntimeError("ElevenLabs not configured (set ELEVENLABS_API_KEY)")
        raise NotImplementedError("ElevenLabs TTS stub (not implemented yet)")
