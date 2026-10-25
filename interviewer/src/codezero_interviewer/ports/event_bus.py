from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable

from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType

EventHandler = Callable[[InterviewEvent], Awaitable[None]]


class IEventBus(ABC):
    @abstractmethod
    def subscribe(self, event_type: InterviewEventType | None, handler: EventHandler) -> None:
        """Subscribe to one type, or all events if event_type is None."""
        raise NotImplementedError

    @abstractmethod
    async def publish(self, event: InterviewEvent) -> None:
        raise NotImplementedError
