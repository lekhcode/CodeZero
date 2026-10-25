from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

Tone = Literal[
    "neutral",
    "encouraging",
    "curious",
    "probing",
    "reassuring",
    "wrapping_up",
]

VALID_TONES: frozenset[str] = frozenset(
    {"neutral", "encouraging", "curious", "probing", "reassuring", "wrapping_up"}
)


def normalize_tone(value: object) -> Tone:
    if isinstance(value, str) and value in VALID_TONES:
        return value  # type: ignore[return-value]
    return "neutral"


@dataclass(frozen=True, slots=True)
class TtsRequest:
    text: str
    voice: str
    tone: Tone = "neutral"
    rate: float = 1.0
    pitch: float = 1.0
    volume: float = 1.0


@dataclass(frozen=True, slots=True)
class TtsResult:
    audio: bytes
    content_type: str
    provider: str
    voice: str
    cached: bool = False


class TtsProvider(ABC):
    name: str

    @abstractmethod
    async def synthesize(self, request: TtsRequest) -> TtsResult:
        raise NotImplementedError
