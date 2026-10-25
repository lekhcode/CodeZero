from __future__ import annotations

from collections.abc import AsyncIterator

from codezero_interviewer.ports.stt import ISTTPort, TranscriptResult
from codezero_interviewer.ports.tts import ITTSPort
from codezero_interviewer.ports.vad import IVADPort, VadSpeechState


class NullSTTAdapter(ISTTPort):
    async def transcribe(self, pcm16_le: bytes, sample_rate: int = 16000) -> TranscriptResult:
        return TranscriptResult(text="", is_final=True, confidence=0.0)


class NullTTSAdapter(ITTSPort):
    async def synthesize(self, text: str, turn_id: str) -> AsyncIterator[bytes]:
        if False:  # pragma: no cover — makes this an async generator
            yield b""
        return

    async def cancel(self, turn_id: str) -> None:
        return None


class NullVADAdapter(IVADPort):
    def reset(self) -> None:
        return None

    def process(self, pcm16_le: bytes, sample_rate: int = 16000) -> VadSpeechState:
        return VadSpeechState.SILENCE
