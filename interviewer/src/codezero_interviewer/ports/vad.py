from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum


class VadSpeechState(str, Enum):
    SILENCE = "silence"
    SPEECH = "speech"


class IVADPort(ABC):
    @abstractmethod
    def reset(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def process(self, pcm16_le: bytes, sample_rate: int = 16000) -> VadSpeechState:
        raise NotImplementedError
