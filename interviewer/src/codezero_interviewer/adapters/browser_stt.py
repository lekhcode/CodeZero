"""Browser STT placeholder — real transcription stays on the client (Web Speech).

Server-side Whisper / cloud STT can implement ISTTPort later without changing
the orchestrator contract.
"""

from __future__ import annotations

from codezero_interviewer.ports.stt import ISTTPort, TranscriptResult


class BrowserSttAdapter(ISTTPort):
    """No-op server STT: FE owns mic → transcript → candidate.turn.finalized."""

    name = "browser-web-speech"

    async def transcribe(self, pcm16_le: bytes, sample_rate: int = 16000) -> TranscriptResult:
        _ = pcm16_le, sample_rate
        return TranscriptResult(text="", is_final=True, confidence=None)
