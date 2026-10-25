from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from codezero_interviewer.application.pronunciation import rewrite_for_speech
from codezero_interviewer.tts.cache import TtsDiskCache
from codezero_interviewer.tts.edge_provider import DEFAULT_EDGE_VOICE, EdgeTtsProvider
from codezero_interviewer.tts.provider import (
    Tone,
    TtsProvider,
    TtsRequest,
    TtsResult,
    normalize_tone,
)
from codezero_interviewer.tts.stubs import AzureTtsProvider, ElevenLabsProvider

logger = logging.getLogger(__name__)


class TtsService:
    def __init__(
        self,
        *,
        cache_dir: str | Path,
        default_voice: str = DEFAULT_EDGE_VOICE,
        timeout_s: float = 4.0,
        provider_name: str = "edge",
    ) -> None:
        self.timeout_s = timeout_s
        self.default_voice = default_voice
        self.cache = TtsDiskCache(cache_dir)
        self._providers: dict[str, TtsProvider] = {
            "edge": EdgeTtsProvider(default_voice=default_voice),
            "azure": AzureTtsProvider(),
            "elevenlabs": ElevenLabsProvider(),
        }
        self.provider_name = provider_name if provider_name in self._providers else "edge"

    def provider(self) -> TtsProvider:
        return self._providers[self.provider_name]

    async def synthesize(
        self,
        text: str,
        *,
        voice: str | None = None,
        tone: str | Tone = "neutral",
        rate: float = 1.0,
        pitch: float = 1.0,
        volume: float = 1.0,
        use_lexicon: bool = True,
    ) -> TtsResult:
        spoken = rewrite_for_speech(text) if use_lexicon else text.strip()
        if not spoken:
            raise ValueError("empty text")
        tone_n = normalize_tone(tone)
        voice_id = voice or self.default_voice
        key = TtsDiskCache.make_key(self.provider_name, voice_id, tone_n, spoken)
        hit = self.cache.get(key)
        if hit is not None:
            audio, ctype = hit
            return TtsResult(
                audio=audio,
                content_type=ctype,
                provider=self.provider_name,
                voice=voice_id,
                cached=True,
            )

        req = TtsRequest(
            text=spoken,
            voice=voice_id,
            tone=tone_n,
            rate=rate,
            pitch=pitch,
            volume=volume,
        )
        try:
            result = await asyncio.wait_for(
                self.provider().synthesize(req), timeout=self.timeout_s
            )
        except TimeoutError as exc:
            raise TimeoutError(f"TTS timed out after {self.timeout_s}s") from exc
        self.cache.put(key, result.audio, result.content_type)
        return result

    async def prewarm(self, lines: list[str], *, voice: str | None = None) -> int:
        ok = 0
        for line in lines:
            try:
                await self.synthesize(line, voice=voice, tone="encouraging")
                ok += 1
            except Exception:
                logger.exception("TTS prewarm failed for %r", line[:40])
        return ok
