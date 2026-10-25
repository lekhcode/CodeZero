from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


class ITTSPort(ABC):
    @abstractmethod
    async def synthesize(self, text: str, turn_id: str) -> AsyncIterator[bytes]:
        """Yield audio chunks. Must stop promptly if turn_id is cancelled upstream."""
        raise NotImplementedError

    @abstractmethod
    async def cancel(self, turn_id: str) -> None:
        raise NotImplementedError
