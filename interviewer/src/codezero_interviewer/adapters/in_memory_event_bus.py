from __future__ import annotations

import logging

from codezero_interviewer.domain.events import InterviewEvent, InterviewEventType
from codezero_interviewer.ports.event_bus import EventHandler, IEventBus

logger = logging.getLogger(__name__)


class InMemoryEventBus(IEventBus):
    def __init__(self) -> None:
        self._handlers: list[tuple[InterviewEventType | None, EventHandler]] = []

    def subscribe(self, event_type: InterviewEventType | None, handler: EventHandler) -> None:
        self._handlers.append((event_type, handler))

    async def publish(self, event: InterviewEvent) -> None:
        for etype, handler in list(self._handlers):
            if etype is None or etype == event.type:
                try:
                    await handler(event)
                except Exception:
                    logger.exception("Event handler failed for %s", event.type.value)
