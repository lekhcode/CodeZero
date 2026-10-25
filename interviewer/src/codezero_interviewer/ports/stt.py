from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TranscriptResult:
    text: str
    is_final: bool
    confidence: float | None = None


class ISTTPort(ABC):
    @abstractmethod
    async def transcribe(self, pcm16_le: bytes, sample_rate: int = 16000) -> TranscriptResult:
        raise NotImplementedError
