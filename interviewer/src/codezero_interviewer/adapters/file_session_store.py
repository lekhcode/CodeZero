"""Local JSON file session store — ₹0 persistence, no external DB."""

from __future__ import annotations

import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any

from codezero_interviewer.ports.session_store import ISessionStore

logger = logging.getLogger(__name__)


class FileSessionStore(ISessionStore):
    def __init__(self, root: str | Path) -> None:
        self._root = Path(root)
        self._root.mkdir(parents=True, exist_ok=True)

    def _path(self, session_id: str) -> Path:
        # Keep filenames filesystem-safe; UUIDs are already safe.
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in session_id)
        return self._root / f"{safe}.json"

    def save(self, session_id: str, snapshot: dict[str, Any]) -> None:
        path = self._path(session_id)
        data = json.dumps(snapshot, ensure_ascii=False, indent=0)
        fd, tmp_name = tempfile.mkstemp(dir=self._root, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(data)
            os.replace(tmp_name, path)
        except Exception:
            try:
                os.unlink(tmp_name)
            except OSError:
                pass
            logger.exception("Failed to persist session %s", session_id)
            raise

    def load(self, session_id: str) -> dict[str, Any] | None:
        path = self._path(session_id)
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            logger.exception("Corrupt session snapshot %s", session_id)
            return None

    def delete(self, session_id: str) -> None:
        path = self._path(session_id)
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Failed to delete session %s", session_id)


class InMemorySessionStore(ISessionStore):
    """Test double / no-disk mode."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}

    def save(self, session_id: str, snapshot: dict[str, Any]) -> None:
        self._data[session_id] = snapshot

    def load(self, session_id: str) -> dict[str, Any] | None:
        return self._data.get(session_id)

    def delete(self, session_id: str) -> None:
        self._data.pop(session_id, None)
