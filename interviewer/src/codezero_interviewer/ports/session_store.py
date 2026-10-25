"""Port for durable interview session snapshots (reconnect / process restart)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ISessionStore(ABC):
    @abstractmethod
    def save(self, session_id: str, snapshot: dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    def load(self, session_id: str) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def delete(self, session_id: str) -> None:
        raise NotImplementedError
