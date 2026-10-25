from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class LLMMessage:
    role: str
    content: str


@dataclass(frozen=True, slots=True)
class LLMRequest:
    messages: list[LLMMessage]
    turn_id: str
    temperature: float = 0.4
    max_tokens: int = 256
    json_schema_name: str | None = "interviewer_decision"
    cancel_token: object | None = None


@dataclass(frozen=True, slots=True)
class LLMResponse:
    text: str
    turn_id: str
    cancelled: bool = False
    raw: dict = field(default_factory=dict)


class ILLMPort(ABC):
    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        raise NotImplementedError

    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Optional streaming; default yields full completion once."""
        result = await self.complete(request)
        if not result.cancelled and result.text:
            yield result.text
