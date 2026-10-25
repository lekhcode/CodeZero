from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)


class TtsDiskCache:
    """Hash-keyed disk cache with simple LRU size eviction."""

    def __init__(self, root: str | Path, *, max_bytes: int = 200_000_000) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.max_bytes = max_bytes
        self._meta_path = self.root / "_index.json"
        self._index: dict[str, dict] = self._load_index()

    def _load_index(self) -> dict[str, dict]:
        if not self._meta_path.exists():
            return {}
        try:
            return json.loads(self._meta_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

    def _save_index(self) -> None:
        try:
            self._meta_path.write_text(json.dumps(self._index), encoding="utf-8")
        except OSError:
            logger.exception("TTS cache index write failed")

    @staticmethod
    def make_key(provider: str, voice: str, tone: str, text: str) -> str:
        norm = " ".join(text.strip().lower().split())
        raw = f"{provider}|{voice}|{tone}|{norm}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, key: str) -> tuple[bytes, str] | None:
        entry = self._index.get(key)
        path = self.root / f"{key}.bin"
        meta = self.root / f"{key}.meta.json"
        if not path.exists():
            return None
        try:
            audio = path.read_bytes()
            ctype = "audio/mpeg"
            if meta.exists():
                ctype = json.loads(meta.read_text(encoding="utf-8")).get(
                    "content_type", ctype
                )
            if entry is not None:
                entry["last_access"] = time.time()
                self._save_index()
            return audio, ctype
        except OSError:
            return None

    def put(self, key: str, audio: bytes, content_type: str) -> None:
        path = self.root / f"{key}.bin"
        meta = self.root / f"{key}.meta.json"
        try:
            path.write_bytes(audio)
            meta.write_text(
                json.dumps({"content_type": content_type}), encoding="utf-8"
            )
            self._index[key] = {
                "size": len(audio),
                "last_access": time.time(),
            }
            self._save_index()
            self._evict_if_needed()
        except OSError:
            logger.exception("TTS cache put failed")

    def _evict_if_needed(self) -> None:
        total = sum(int(v.get("size", 0)) for v in self._index.values())
        if total <= self.max_bytes:
            return
        ordered = sorted(
            self._index.items(), key=lambda kv: float(kv[1].get("last_access", 0))
        )
        for key, info in ordered:
            if total <= self.max_bytes * 0.8:
                break
            for suffix in (".bin", ".meta.json"):
                try:
                    (self.root / f"{key}{suffix}").unlink(missing_ok=True)
                except OSError:
                    pass
            total -= int(info.get("size", 0))
            self._index.pop(key, None)
        self._save_index()
