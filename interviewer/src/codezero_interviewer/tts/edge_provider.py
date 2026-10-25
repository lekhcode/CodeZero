from __future__ import annotations

import logging

from codezero_interviewer.tts.provider import TtsProvider, TtsRequest, TtsResult
from codezero_interviewer.tts.tone_params import delivery_for

logger = logging.getLogger(__name__)

DEFAULT_EDGE_VOICE = "en-IN-NeerjaNeural"
ALT_EDGE_VOICE = "en-IN-PrabhatNeural"


class EdgeTtsProvider(TtsProvider):
    name = "edge"

    def __init__(self, default_voice: str = DEFAULT_EDGE_VOICE) -> None:
        self.default_voice = default_voice

    async def synthesize(self, request: TtsRequest) -> TtsResult:
        try:
            import edge_tts
        except ImportError as exc:
            raise RuntimeError(
                "edge-tts is required. pip install edge-tts"
            ) from exc

        voice = request.voice or self.default_voice
        # Legacy SAPI/browser names are not valid Edge neural IDs.
        if not voice or "Neural" not in voice:
            voice = self.default_voice if "Neural" in (self.default_voice or "") else DEFAULT_EDGE_VOICE
        delivery = delivery_for(request.tone)
        rate_pct = int(round((request.rate * delivery.rate_mult - 1.0) * 100))
        rate_str = f"{rate_pct:+d}%"
        pitch_hz = int(round((request.pitch - 1.0) * 20)) + delivery.pitch_hz
        pitch_str = f"{pitch_hz:+d}Hz"
        vol_pct = int(round((request.volume * delivery.volume_mult - 1.0) * 100))
        vol_str = f"{vol_pct:+d}%"

        communicate = edge_tts.Communicate(
            request.text,
            voice,
            rate=rate_str,
            pitch=pitch_str,
            volume=vol_str,
        )
        chunks: list[bytes] = []
        async for message in communicate.stream():
            if message["type"] == "audio":
                chunks.append(message["data"])
        audio = b"".join(chunks)
        if not audio:
            raise RuntimeError("edge-tts returned empty audio")
        return TtsResult(
            audio=audio,
            content_type="audio/mpeg",
            provider=self.name,
            voice=voice,
            cached=False,
        )
